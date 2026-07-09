"use strict";

// Compiles a small document end to end. Needs the binary for this platform,
// so run `npm run fetch:current` first.

const assert = require("assert");
const { compile, binaryPath, tectonicVersion } = require("..");

const tex = `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}
Test document. \\[ E = mc^2 \\]
\\end{document}`;

async function main() {
  console.log("binary:", binaryPath());
  console.log("tectonic:", tectonicVersion);

  const result = await compile({ tex, returnBuffer: true });

  assert.strictEqual(result.success, true, `compile failed:\n${result.stderr}`);
  assert.ok(result.pdfBuffer, "no pdfBuffer");
  assert.strictEqual(result.pdfBuffer.slice(0, 5).toString("latin1"), "%PDF-");

  console.log(`ok, ${result.pdfBuffer.length} byte pdf`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
