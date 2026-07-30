"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  binaryPath,
  compile,
  platformPackageName,
  run,
  tectonicVersion,
} = require("..");
const { buildCompileArguments } = require("../lib/arguments");
const {
  diagnoseCompileFailure,
  looksLikeNetworkFailure,
} = require("../lib/diagnostics");
const { PLATFORMS, currentKey } = require("../lib/platforms");

async function main() {
  const expectedPackage = PLATFORMS[currentKey()].pkg;
  assert.strictEqual(platformPackageName(), expectedPackage);
  assert.ok(fs.existsSync(binaryPath()), "current platform binary is missing");

  const version = await run(["--version"]);
  assert.strictEqual(version.exitCode, 0, version.stderr);
  assert.strictEqual(version.signal, null);
  assert.strictEqual(version.timedOut, false);
  assert.match(`${version.stdout}\n${version.stderr}`, new RegExp(tectonicVersion));

  assert.throws(
    () => run("--version"),
    /array of string arguments/
  );
  assert.throws(
    () => run(["--version"], { timeout: 0 }),
    /positive number/
  );
  await assert.rejects(
    () => compile({}),
    /exactly one/
  );
  await assert.rejects(
    () => compile({ tex: 42 }),
    /string or Buffer/
  );
  await assert.rejects(
    () => compile({ tex: "test", args: ["--print", 42] }),
    /array of strings/
  );

  assert.deepStrictEqual(
    buildCompileArguments("/tmp/source.tex", "/tmp/output", {
      args: ["--keep-logs"],
      bundle: "/opt/tectonic/bundle",
      onlyCached: true,
      untrusted: true,
    }),
    [
      "--keep-logs",
      "--bundle",
      "/opt/tectonic/bundle",
      "--only-cached",
      "--untrusted",
      "--outdir",
      "/tmp/output",
      "/tmp/source.tex",
    ]
  );
  assert.throws(
    () =>
      buildCompileArguments("/tmp/source.tex", "/tmp/output", {
        bundle: "",
      }),
    /non-empty URL or path/
  );

  const macSandboxPanic = `
thread 'reqwest-internal-sync-runtime' panicked at system-configuration:
Attempted to create a NULL object.
event loop thread panicked`;
  assert.strictEqual(looksLikeNetworkFailure(macSandboxPanic), true);
  assert.deepStrictEqual(
    diagnoseCompileFailure(
      {
        exitCode: 101,
        signal: null,
        timedOut: false,
        stdout: "",
        stderr: macSandboxPanic,
      },
      false
    ),
    {
      code: "network",
      message:
        "Tectonic could not access its TeX resource bundle. The first compile " +
        "needs network access unless you provide a local bundle; cached-only " +
        "compiles only work after the required resources have been cached.",
    }
  );
  assert.strictEqual(
    diagnoseCompileFailure(
      {
        exitCode: 0,
        signal: null,
        timedOut: false,
        stdout: "",
        stderr: "",
      },
      true
    ),
    null
  );
  assert.strictEqual(
    diagnoseCompileFailure(
      {
        exitCode: null,
        signal: "SIGTERM",
        timedOut: true,
        stdout: "",
        stderr: "",
      },
      false
    ).code,
    "timeout"
  );

  // This is both a regression test and executable documentation for output
  // tracing: package names must remain literal require() arguments.
  const resolverSource = fs.readFileSync(
    path.join(__dirname, "..", "lib", "binary.js"),
    "utf8"
  );
  const rootPackage = require("../package.json");
  for (const [key, spec] of Object.entries(PLATFORMS)) {
    assert.ok(
      resolverSource.includes(`require("${spec.pkg}")`),
      `${spec.pkg} must use a literal require()`
    );

    const platformDir = path.join(__dirname, "..", "npm", key);
    const platformPackage = JSON.parse(
      fs.readFileSync(path.join(platformDir, "package.json"), "utf8")
    );
    assert.strictEqual(platformPackage.name, spec.pkg);
    assert.strictEqual(
      platformPackage.version,
      rootPackage.optionalDependencies[spec.pkg]
    );
    assert.strictEqual(platformPackage.main, "index.js");
    assert.strictEqual(platformPackage.exports, "./index.js");
    assert.ok(platformPackage.files.includes("index.js"));

    const platformEntry = fs.readFileSync(
      path.join(platformDir, "index.js"),
      "utf8"
    );
    assert.ok(platformEntry.includes(`"bin", "${spec.binary}"`));
    assert.ok(platformEntry.includes("fs.existsSync(binaryPath)"));
  }

  console.log("unit tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
