/// <reference types="node" />

export interface RunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export interface RunOptions {
  /** Working directory for the tectonic process. */
  cwd?: string;
  /** Kill the process after this many milliseconds. */
  timeout?: number;
  /** Called with each chunk written to stdout. */
  onStdout?: (chunk: string) => void;
  /** Called with each chunk written to stderr. */
  onStderr?: (chunk: string) => void;
  /** Written to the child's stdin. */
  input?: string | Buffer;
}

export interface CompileOptions {
  /** LaTeX source. Mutually exclusive with `texFile`. */
  tex?: string;
  /** Path to a .tex file. Mutually exclusive with `tex`. */
  texFile?: string;
  /** Where build artifacts go. Defaults to the source directory, or cwd. */
  outputDir?: string;
  /** Also return the PDF as a Buffer. */
  returnBuffer?: boolean;
  /** Extra command line arguments forwarded to tectonic. */
  args?: string[];
  /** Kill the process after this many milliseconds. */
  timeout?: number;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

export interface CompileResult {
  /** True when tectonic exited 0 and a PDF was produced. */
  success: boolean;
  exitCode: number | null;
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

/** The upstream tectonic version this package ships. */
export const tectonicVersion: string;
