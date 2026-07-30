"use strict";

const fs = require("fs");
const path = require("path");

const binaryPath = path.join(__dirname, "bin", "tectonic");
if (!fs.existsSync(binaryPath)) {
  throw new Error(`node-tectonic-darwin-x64 is missing ${binaryPath}. Reinstall it.`);
}

module.exports = binaryPath;
