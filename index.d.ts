/// <reference types="node" />

export interface RunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  /** True when the configured timeout terminated the child process. */
  timedOut: boolean;
  stdout: string;
  stderr: string;
}

export interface RunOptions {
  /** Working directory for the tectonic process. */
  cwd?: string;
  /** Kill the process after this many milliseconds. */
  timeout?: number;
  /** Signal used when `timeout` expires. Defaults to SIGTERM. */
  killSignal?: NodeJS.Signals | number;
  /** Environment for the Tectonic process. Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /** Hide the child console window on Windows. Defaults to true. */
  windowsHide?: boolean;
  /** Called with each chunk written to stdout. */
  onStdout?: (chunk: string) => void;
  /** Called with each chunk written to stderr. */
  onStderr?: (chunk: string) => void;
  /** Written to the child's stdin. */
  input?: string | Buffer;
}

export interface CompileOptions {
  /** LaTeX source. Mutually exclusive with `texFile`. */
  tex?: string | Buffer;
  /** Path to a .tex file. Mutually exclusive with `tex`. */
  texFile?: string;
  /** Where build artifacts go. Defaults to the source directory, or cwd. */
  outputDir?: string;
  /** Working directory for the Tectonic process. */
  cwd?: string;
  /** Also return the PDF as a Buffer. */
  returnBuffer?: boolean;
  /** Extra command line arguments forwarded to tectonic. */
  args?: string[];
  /** Use this URL or local path as Tectonic's resource bundle. */
  bundle?: string;
  /** Forbid network access and use only resources already in Tectonic's cache. */
  onlyCached?: boolean;
  /** Disable Tectonic features that are unsafe for untrusted input. */
  untrusted?: boolean;
  /** Kill the process after this many milliseconds. */
  timeout?: number;
  /** Signal used when `timeout` expires. Defaults to SIGTERM. */
  killSignal?: NodeJS.Signals | number;
  /** Environment for the Tectonic process. Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /** Hide the child console window on Windows. Defaults to true. */
  windowsHide?: boolean;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

export type CompileFailureCode =
  | "compile"
  | "missing-output"
  | "network"
  | "terminated"
  | "timeout";

export interface CompileFailure {
  code: CompileFailureCode;
  message: string;
}

export interface CompileResult {
  /** True when tectonic exited 0 and a PDF was produced. */
  success: boolean;
  exitCode: number | null;
  /** Signal that terminated Tectonic, or null after a normal exit. */
  signal: NodeJS.Signals | null;
  /** True when the configured timeout terminated Tectonic. */
  timedOut: boolean;
  /** A stable failure category and actionable message. Null on success. */
  failure: CompileFailure | null;
  /**
   * Absolute path to the PDF. Null on failure, and also null when the PDF
   * only exists as `pdfBuffer` (returnBuffer set with no outputDir).
   */
  pdfPath: string | null;
  /** The PDF bytes. Only set when `returnBuffer` was passed and compilation succeeded. */
  pdfBuffer: Buffer | null;
  stdout: string;
  stderr: string;
}

/** Compile a LaTeX document to PDF. */
export function compile(config: CompileOptions): Promise<CompileResult>;

/** Run the tectonic binary with raw arguments. */
export function run(args: string[], options?: RunOptions): Promise<RunResult>;

/** Absolute path to the bundled tectonic executable. Throws if unavailable. */
export function binaryPath(): string;

/** Name of the optional binary package for this platform, or null if unsupported. */
export function platformPackageName(): string | null;

/** The upstream tectonic version this package ships. */
export const tectonicVersion: string;
