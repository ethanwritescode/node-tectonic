"use strict";

// The tectonic release this package ships. Bump it and re-run `npm run fetch`
// to pick up a newer engine.
const TECTONIC_VERSION = "0.16.9";

// Keyed by `${process.platform}-${process.arch}`. `target` is the Rust triple
// used in the upstream release asset names.
const PLATFORMS = {
  "darwin-arm64": {
    pkg: "node-tectonic-darwin-arm64",
    target: "aarch64-apple-darwin",
    archive: "tar.gz",
    binary: "tectonic",
    os: "darwin",
    cpu: "arm64",
  },
  "darwin-x64": {
    pkg: "node-tectonic-darwin-x64",
    target: "x86_64-apple-darwin",
    archive: "tar.gz",
    binary: "tectonic",
    os: "darwin",
    cpu: "x64",
  },
  "linux-x64": {
    pkg: "node-tectonic-linux-x64",
    target: "x86_64-unknown-linux-gnu",
    archive: "tar.gz",
    binary: "tectonic",
    os: "linux",
    cpu: "x64",
  },
  "linux-arm64": {
    // Upstream only ships musl for aarch64. It's statically linked, so it
    // runs on glibc systems too.
    pkg: "node-tectonic-linux-arm64",
    target: "aarch64-unknown-linux-musl",
    archive: "tar.gz",
    binary: "tectonic",
    os: "linux",
    cpu: "arm64",
  },
  "win32-x64": {
    pkg: "node-tectonic-win32-x64",
    target: "x86_64-pc-windows-msvc",
    archive: "zip",
    binary: "tectonic.exe",
    os: "win32",
    cpu: "x64",
  },
};

function currentKey() {
  return `${process.platform}-${process.arch}`;
}

function assetName(spec, version = TECTONIC_VERSION) {
  return `tectonic-${version}-${spec.target}.${spec.archive}`;
}

function downloadUrl(spec, version = TECTONIC_VERSION) {
  return (
    "https://github.com/tectonic-typesetting/tectonic/releases/download/" +
    `tectonic%40${version}/${assetName(spec, version)}`
  );
}

module.exports = {
  TECTONIC_VERSION,
  PLATFORMS,
  currentKey,
  assetName,
  downloadUrl,
};
