"use strict";

const fs = require("fs");
const path = require("path");

const binaryPath = path.join(__dirname, "bin", "tectonic.exe");
if (!fs.existsSync(binaryPath)) {
  throw new Error(`node-tectonic-windows-x64 is missing ${binaryPath}. Reinstall it.`);
}

module.exports = binaryPath;
