#!/usr/bin/env node
"use strict";

// Downloads the pinned tectonic release binaries into npm/<platform>/bin.
// Run before publishing.
//
//   node scripts/fetch-binaries.js                 all platforms
//   node scripts/fetch-binaries.js --current       just this machine's
//   node scripts/fetch-binaries.js darwin-arm64 linux-x64

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const {
  PLATFORMS,
  TECTONIC_VERSION,
  currentKey,
  assetName,
  downloadUrl,
} = require("../lib/platforms");

const NPM_DIR = path.join(__dirname, "..", "npm");

function selectTargets(argv) {
  const args = argv.slice(2);
  if (args.includes("--current")) return [currentKey()];
  const explicit = args.filter((a) => !a.startsWith("--"));
  return explicit.length ? explicit : Object.keys(PLATFORMS);
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function extract(archivePath, destDir, spec) {
  if (spec.archive === "zip") {
    // macOS and most Linuxes have unzip; Windows runners have bsdtar, which
    // reads zips too.
    try {
      execFileSync("unzip", ["-o", "-q", archivePath, "-d", destDir], { stdio: "inherit" });
    } catch {
      execFileSync("tar", ["-xf", archivePath, "-C", destDir], { stdio: "inherit" });
    }
  } else {
    execFileSync("tar", ["-xzf", archivePath, "-C", destDir], { stdio: "inherit" });
  }
}

function fetchOne(key) {
  const spec = PLATFORMS[key];
  if (!spec) {
    throw new Error(`Unknown platform ${key}. Known: ${Object.keys(PLATFORMS).join(", ")}`);
  }

  const url = downloadUrl(spec);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tectonic-fetch-"));
  const archivePath = path.join(tmp, assetName(spec));

  try {
    console.log(`${key}: downloading ${url}`);
    execFileSync("curl", ["-fsSL", "-o", archivePath, url], { stdio: "inherit" });

    extract(archivePath, tmp, spec);

    const extracted = path.join(tmp, spec.binary);
    if (!fs.existsSync(extracted)) {
      throw new Error(
        `${spec.binary} not found in archive. Contents: ${fs.readdirSync(tmp).join(", ")}`
      );
    }

    const binDir = path.join(NPM_DIR, key, "bin");
    fs.mkdirSync(binDir, { recursive: true });
    const dest = path.join(binDir, spec.binary);
    fs.copyFileSync(extracted, dest);
    fs.chmodSync(dest, 0o755);

    const mb = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
    console.log(`${key}: ${dest} (${mb} MB, sha256 ${sha256(dest)})`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const targets = selectTargets(process.argv);
console.log(`fetching tectonic ${TECTONIC_VERSION}: ${targets.join(", ")}`);
for (const key of targets) fetchOne(key);
