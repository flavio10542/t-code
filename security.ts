import * as vscode from "vscode";

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\b(?:password|passwd|pwd|secret|client_secret|api[_-]?key)\s*[:=]\s*["'][^"']+["']/gi,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi
];

export function redactSecrets(input: string): string {
  let output = input;

  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, "[REDACTED_BY_T_CODE]");
  }

  return output;
}

export function isWorkspaceTrusted(): boolean {
  return vscode.workspace.isTrusted;
}

export function assertSafeWorkspace(): void {
  if (!isWorkspaceTrusted()) {
    throw new Error(
      "T-Code requires a trusted VS Code workspace before sending code to the internal AI service."
    );
  }
}

export function validateInternalEndpoint(endpoint: string): void {
  const url = new URL(endpoint);

  // Production should use an allowlist of corporate domains.
  const allowedSuffixes = [
    ".internal.example",
    ".deutschetelekom.com"
  ];

  const isAllowed = allowedSuffixes.some(
    suffix => url.hostname === suffix.slice(1) || url.hostname.endsWith(suffix)
  );

  if (!isAllowed) {
    throw new Error(
      "T-Code blocked the request because the configured LLM endpoint is not on the corporate allowlist."
    );
  }

  if (url.protocol !== "https:") {
    throw new Error("T-Code requires HTTPS for the LLM endpoint.");
  }
}
