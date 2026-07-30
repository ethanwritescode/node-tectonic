# node-tectonic

[![npm](https://img.shields.io/npm/v/node-tectonic)](https://www.npmjs.com/package/node-tectonic)

Compile LaTeX to PDF from Node.js without installing TeX.

This wraps the [Tectonic](https://tectonic-typesetting.github.io/) engine and
ships the native binary for your platform as an npm optional dependency, the
same way esbuild distributes its binaries. Tectonic itself downloads LaTeX
packages on demand the first time a document uses them, so there's no TeX Live
install anywhere in the picture. Downloaded packages are cached under the OS
cache directory, so only the first compile needs network access.

If the first download fails, `compile()` returns `success: false` with
`failure.code === "network"` and an actionable message. This includes a known
Tectonic 0.16.9 macOS failure mode where its networking layer prints a Rust
panic in a locked-down process sandbox.

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
if (!result.success) {
  throw new Error(`${result.failure.message}\n${result.stderr}`);
}
// result.pdfBuffer is the PDF
```

```js
// From a file, writing doc.pdf next to it
await compile({ texFile: "./doc.tex" });

// Into a specific directory, streaming compiler output
await compile({
  texFile: "./doc.tex",
  outputDir: "./build",
  cwd: process.cwd(),
  onStderr: (chunk) => process.stderr.write(chunk),
});
```

`compile()` never throws on compilation errors; check `result.success` and
read `result.failure`, `result.stderr`, and `result.stdout`. It only throws for
bad arguments, a missing binary, or failure to spawn the process.

Options: `tex` or `texFile` (exactly one), `outputDir`, `returnBuffer`,
`cwd`, `args` (extra CLI flags), `bundle` (a bundle URL or local path),
`onlyCached`, `untrusted`, `timeout` (ms), `killSignal`, `env`, `onStdout`,
and `onStderr`. Full types are in `index.d.ts`.

Use `untrusted: true` whenever the LaTeX source itself comes from an untrusted
user. Escaping user values before inserting them into an application-owned
template is still the safer design.

Also exported: `run(args, options)` for raw invocations, `binaryPath()`, and
`tectonicVersion`. `platformPackageName()` returns the optional native package
name selected for the current OS and CPU.

### Network and offline deployments

Tectonic downloads its default TeX resource bundle on demand. For production,
choose one of these strategies:

- allow outbound network access and a writable, persistent OS cache;
- pre-warm and preserve the Tectonic cache in your image or runtime;
- pass `bundle` with a local bundle path or an internally hosted bundle URL.

After all required resources are cached, `onlyCached: true` instructs Tectonic
to use only those cached resources. It does not populate an empty cache.
Tectonic 0.16.9 on macOS may still initialize its networking layer before
honoring that mode, so a locked-down process sandbox can still trigger the
native panic described above; the wrapper reports it as a `network` failure.

### Next.js and serverless deployments

`node-tectonic` starts a native process, so use the Node.js runtime rather than
an Edge runtime:

```ts
// app/api/compile/route.ts
export const runtime = "nodejs";
```

If your framework bundles server dependencies, keep `node-tectonic` external.
For Next.js:

```ts
// next.config.ts
const nextConfig = {
  serverExternalPackages: ["node-tectonic"],
};
export default nextConfig;
```

The platform package resolution uses literal `require()` calls so
static output tracers can include the selected `node-tectonic-*` binary.
Versions through 1.0.1 used a computed package name; applications pinned to
one of those versions need an explicit tracing include such as
`./node_modules/node-tectonic-*/**/*`.

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
node scripts/set-version.js 1.1.0
git commit -am "v1.1.0"
git tag v1.1.0
git push origin main v1.1.0
```

The workflow publishes the platform packages before the root package, since
the root's optionalDependencies have to exist on the registry first. Versions
that are already published get skipped, so reruns are safe.

To ship a newer engine, bump `TECTONIC_VERSION` in `lib/platforms.js` and cut
a release.

## License

MIT. The platform packages contain unmodified tectonic release binaries,
which are also MIT.
