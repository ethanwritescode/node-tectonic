"use strict";

const fs = require("fs");
const path = require("path");
const { PLATFORMS, currentKey } = require("./platforms");

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

  // Installed case: the binary lives in the platform package. Resolve its
  // package.json rather than a deep path so this keeps working if the
  // package ever grows an exports field.
  try {
    const pkgJsonPath = require.resolve(`${spec.pkg}/package.json`);
    const binPath = path.join(path.dirname(pkgJsonPath), "bin", spec.binary);
    if (!fs.existsSync(binPath)) {
      throw new Error(`${spec.pkg} is installed but ${binPath} is missing. Reinstall it.`);
    }
    return binPath;
  } catch (err) {
    if (err.code !== "MODULE_NOT_FOUND") throw err;
  }

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

module.exports = { resolveBinaryPath };
