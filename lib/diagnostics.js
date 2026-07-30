"use strict";

const NETWORK_ERROR_PATTERNS = [
  /\breqwest\b/i,
  /\bconnection (?:failed|refused|reset|timed out)\b/i,
  /\b(?:dns|host) (?:lookup|resolution) failed\b/i,
  /\berror sending request\b/i,
  /\bfailed to resolve host\b/i,
  /\bfailed to (?:download|fetch|retrieve)\b/i,
  /\b(?:certificate|ssl|tls) error\b/i,
  /\bevent loop thread panicked\b/i,
];

function looksLikeNetworkFailure(output) {
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(output));
}

function diagnoseCompileFailure(result, pdfExists) {
  if (result.exitCode === 0 && pdfExists) return null;

  if (result.timedOut) {
    return {
      code: "timeout",
      message: "Tectonic exceeded the configured timeout and was terminated.",
    };
  }

  if (result.signal) {
    return {
      code: "terminated",
      message: `Tectonic was terminated by ${result.signal}.`,
    };
  }

  const output = `${result.stderr || ""}\n${result.stdout || ""}`;
  if (looksLikeNetworkFailure(output)) {
    return {
      code: "network",
      message:
        "Tectonic could not access its TeX resource bundle. The first compile " +
        "needs network access unless you provide a local bundle; cached-only " +
        "compiles only work after the required resources have been cached.",
    };
  }

  if (result.exitCode === 0 && !pdfExists) {
    return {
      code: "missing-output",
      message: "Tectonic exited successfully but did not produce the expected PDF.",
    };
  }

  return {
    code: "compile",
    message: `Tectonic exited with code ${result.exitCode ?? "unknown"}.`,
  };
}

module.exports = {
  diagnoseCompileFailure,
  looksLikeNetworkFailure,
};
