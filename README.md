# node-tectonic

Compile LaTeX to PDF from Node.js without installing TeX.

This wraps the [Tectonic](https://tectonic-typesetting.github.io/) engine and
ships the native binary for your platform as an npm optional dependency, the
same way esbuild distributes its binaries. Tectonic itself downloads LaTeX
packages on demand the first time a document uses them, so there's no TeX Live
install anywhere in the picture. Downloaded packages are cached under the OS
cache directory, so only the first compile needs network access.

## Install

```bash
npm install node-tectonic
```

npm only downloads the binary package matching your OS and CPU. Installing
with `--omit=optional` skips it; if you hit that, the error message tells you
which package to install by hand.

## CLI

```bash
npx tectonic --version
npx tectonic mydoc.tex
```

Arguments are passed straight through to the tectonic executable.

## API

```js
const { compile } = require("node-tectonic");

const result = await compile({
  tex: String.raw`
    \documentclass{article}
    \begin{document} Hello, \(E = mc^2\). \end{document}`,
  returnBuffer: true,
});
if (!result.success) throw new Error(result.stderr);
// result.pdfBuffer is the PDF
```

```js
// From a file, writing doc.pdf next to it
await compile({ texFile: "./doc.tex" });

// Into a specific directory, streaming compiler output
await compile({
  texFile: "./doc.tex",
  outputDir: "./build",
  onStderr: (chunk) => process.stderr.write(chunk),
});
```

`compile()` never throws on compilation errors; check `result.success` and
read `result.stderr`. It only throws for bad arguments or a missing binary.

Options: `tex` or `texFile` (exactly one), `outputDir`, `returnBuffer`,
`args` (extra CLI flags), `timeout` (ms), `onStdout`, `onStderr`. Full types
in `index.d.ts`.

Also exported: `run(args, options)` for raw invocations, `binaryPath()`, and
`tectonicVersion`.

## Supported platforms

| | x64 | arm64 |
|---|---|---|
| macOS | yes | yes |
| Linux | yes | yes (musl, static) |
| Windows | yes | no |

## Development

```
index.js, index.d.ts      API
bin/tectonic.js           CLI shim
lib/platforms.js          platform table and version pin
lib/binary.js             binary resolution
npm/<platform>/           one publishable package per platform
scripts/fetch-binaries.js downloads release binaries into npm/*/bin
scripts/set-version.js    bumps the version across all manifests
```

Releasing (CI publishes on tag, needs an `NPM_TOKEN` repo secret):

```bash
node scripts/set-version.js 1.0.1
git commit -am "v1.0.1"
git tag v1.0.1
git push --follow-tags
```

The workflow publishes the platform packages before the root package, since
the root's optionalDependencies have to exist on the registry first. Versions
that are already published get skipped, so reruns are safe.

To ship a newer engine, bump `TECTONIC_VERSION` in `lib/platforms.js` and cut
a release.

## License

MIT. The platform packages contain unmodified tectonic release binaries,
which are also MIT.
