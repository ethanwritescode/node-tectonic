"use strict";

function buildCompileArguments(inputPath, outputDir, config) {
  const args = [...(config.args || [])];

  if (config.bundle != null) {
    if (typeof config.bundle !== "string" || config.bundle.length === 0) {
      throw new TypeError("`bundle` must be a non-empty URL or path string.");
    }
    args.push("--bundle", config.bundle);
  }
  if (config.onlyCached) args.push("--only-cached");
  if (config.untrusted) args.push("--untrusted");

  // Put the managed output directory after caller-provided flags so an
  // accidental --outdir in `args` cannot redirect output outside the path
  // that compile() reads and cleans up.
  args.push("--outdir", outputDir, inputPath);
  return args;
}

module.exports = { buildCompileArguments };
