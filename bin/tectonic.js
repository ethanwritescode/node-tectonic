#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const { resolveBinaryPath } = require("../lib/binary");

let binary;
try {
  binary = resolveBinaryPath();
} catch (err) {
  process.stderr.write(`tectonic: ${err.message}\n`);
  process.exit(1);
}

const result = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });

if (result.error) {
  process.stderr.write(`tectonic: ${result.error.message}\n`);
  process.exit(1);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
}

process.exit(result.status === null ? 1 : result.status);
