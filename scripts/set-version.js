#!/usr/bin/env node
"use strict";

// Sets the version everywhere it has to stay in lockstep: the root
// package.json, its optionalDependencies, and the platform packages.
//
//   node scripts/set-version.js 1.0.1

const fs = require("fs");
const path = require("path");
const { PLATFORMS } = require("../lib/platforms");

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error("usage: node scripts/set-version.js <version>");
  process.exit(1);
}

const root = path.join(__dirname, "..");

function rewrite(file, mutate) {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  mutate(pkg);
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${path.relative(root, file)} -> ${version}`);
}

rewrite(path.join(root, "package.json"), (pkg) => {
  pkg.version = version;
  for (const name of Object.keys(pkg.optionalDependencies || {})) {
    pkg.optionalDependencies[name] = version;
  }
});

for (const key of Object.keys(PLATFORMS)) {
  rewrite(path.join(root, "npm", key, "package.json"), (pkg) => {
    pkg.version = version;
  });
}
