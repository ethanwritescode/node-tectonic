"use strict";

const fs = require("fs");
const path = require("path");
const { PLATFORMS, currentKey } = require("./platforms");

// Keep every package name as a literal require() call. Each platform package's
// JavaScript entry point exports its executable path and touches the file with
// fs.existsSync(), allowing deployment tracers such as @vercel/nft to include
// the executable as a non-JavaScript asset.
function resolveInstalledBinaryPath(key) {
  try {
    switch (key) {
      case "darwin-arm64":
        return require("node-tectonic-darwin-arm64");
      case "darwin-x64":
        return require("node-tectonic-darwin-x64");
      case "linux-x64":
        return require("node-tectonic-linux-x64");
      case "linux-arm64":
        return require("node-tectonic-linux-arm64");
      case "win32-x64":
        return require("node-tectonic-windows-x64");
      default:
        return null;
    }
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") return null;
    throw error;
  }
}

function platformPackageName() {
  const spec = PLATFORMS[currentKey()];
  return spec ? spec.pkg : null;
}

// Returns the absolute path to the tectonic executable for this platform.
function resolveBinaryPath() {
  const key = currentKey();
  const spec = PLATFORMS[key];

  if (!spec) {
    throw new Error(
      `Unsupported platform ${key}. Prebuilt tectonic binaries exist for: ` +
        Object.keys(PLATFORMS).join(", ")
    );
  }

  const installedBinary = resolveInstalledBinaryPath(key);
  if (installedBinary) return installedBinary;

  // Working from a checkout: use whatever scripts/fetch-binaries.js put in
  // npm/. This directory isn't shipped in the published package.
  const local = path.join(__dirname, "..", "npm", key, "bin", spec.binary);
  if (fs.existsSync(local)) {
    return local;
  }

  throw new Error(
    `${spec.pkg} is not installed. It's an optional dependency of ` +
      `node-tectonic, so it gets skipped by --omit=optional or a stale ` +
      `lockfile. Fix with: npm install ${spec.pkg}`
  );
}

module.exports = {
  platformPackageName,
  resolveBinaryPath,
  resolveInstalledBinaryPath,
};
