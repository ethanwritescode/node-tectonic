"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const {
  platformPackageName,
  resolveBinaryPath,
} = require("./lib/binary");
const { buildCompileArguments } = require("./lib/arguments");
const { diagnoseCompileFailure } = require("./lib/diagnostics");
const { TECTONIC_VERSION } = require("./lib/platforms");

function binaryPath() {
  return resolveBinaryPath();
}

/**
 * Run the tectonic binary with raw arguments. Resolves with the captured
 * output whatever the exit code; rejects only if the process fails to spawn.
 */
function run(args, options = {}) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("run() requires an array of string arguments.");
  }
  if (
    options.timeout != null &&
    (!Number.isFinite(options.timeout) || options.timeout <= 0)
  ) {
    throw new TypeError("`timeout` must be a positive number of milliseconds.");
  }

  const bin = resolveBinaryPath();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: options.cwd,
      env: options.env,
      killSignal: options.killSignal,
      windowsHide: options.windowsHide !== false,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let timeoutId = null;

    if (options.timeout != null) {
      timeoutId = setTimeout(() => {
        timedOut = child.kill(options.killSignal || "SIGTERM");
      }, options.timeout);
      timeoutId.unref();
    }

    child.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      if (options.onStdout) options.onStdout(s);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      if (options.onStderr) options.onStderr(s);
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    });
    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      resolve({
        exitCode: code,
        signal,
        timedOut,
        stdout,
        stderr,
      });
    });

    // Close stdin so a document that reads from the terminal errors out
    // instead of hanging.
    child.stdin.end(options.input != null ? options.input : undefined);
  });
}

/**
 * Compile a LaTeX document to PDF. Takes exactly one of `tex` (source string)
 * or `texFile` (path). See index.d.ts for the full option list.
 */
async function compile(config = {}) {
  const { tex, texFile } = config;
  if ((tex == null) === (texFile == null)) {
    throw new Error("compile() requires exactly one of `tex` or `texFile`.");
  }
  if (tex != null && typeof tex !== "string" && !Buffer.isBuffer(tex)) {
    throw new TypeError("`tex` must be a string or Buffer.");
  }
  if (texFile != null && typeof texFile !== "string") {
    throw new TypeError("`texFile` must be a path string.");
  }
  if (
    config.args != null &&
    (!Array.isArray(config.args) ||
      config.args.some((arg) => typeof arg !== "string"))
  ) {
    throw new TypeError("`args` must be an array of strings.");
  }

  const cleanup = new Set();

  try {
    let inputPath;
    if (texFile != null) {
      inputPath = path.resolve(texFile);
      if (!fs.existsSync(inputPath)) {
        throw new Error(`texFile not found: ${inputPath}`);
      }
    } else {
      const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-tectonic-src-"));
      cleanup.add(srcDir);
      inputPath = path.join(srcDir, "input.tex");
      fs.writeFileSync(inputPath, tex, "utf8");
    }

    // An explicit outputDir belongs to the caller. With returnBuffer and no
    // outputDir we build into a temp dir and delete it after reading the PDF
    // back. Otherwise artifacts land next to the input, or in cwd for string
    // input.
    let outputDir;
    if (config.outputDir) {
      outputDir = path.resolve(config.outputDir);
    } else if (config.returnBuffer) {
      outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-tectonic-out-"));
      cleanup.add(outputDir);
    } else {
      outputDir = texFile != null ? path.dirname(inputPath) : process.cwd();
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const args = buildCompileArguments(inputPath, outputDir, config);

    const result = await run(args, {
      cwd: config.cwd,
      env: config.env,
      killSignal: config.killSignal,
      timeout: config.timeout,
      windowsHide: config.windowsHide,
      onStdout: config.onStdout,
      onStderr: config.onStderr,
    });

    const base = path.basename(inputPath, path.extname(inputPath));
    const pdfPath = path.join(outputDir, `${base}.pdf`);
    const pdfExists = fs.existsSync(pdfPath);
    const success = result.exitCode === 0 && pdfExists;
    const failure = diagnoseCompileFailure(result, pdfExists);

    let pdfBuffer = null;
    if (success && config.returnBuffer) {
      pdfBuffer = fs.readFileSync(pdfPath);
    }

    // Never return a path into a temp dir we're about to delete.
    const pdfPersists = success && !cleanup.has(outputDir);

    return {
      success,
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: result.timedOut,
      failure,
      pdfPath: pdfPersists ? pdfPath : null,
      pdfBuffer,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    for (const dir of cleanup) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

module.exports = {
  compile,
  run,
  binaryPath,
  platformPackageName,
  tectonicVersion: TECTONIC_VERSION,
};
