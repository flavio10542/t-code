# T-Code — Secure Agent for VS Code

Prototype based on the T-Code concept presented for the GDC Brazil Hackathon:

- VS Code IDE plugin
- Internal/corporate LLM
- Code processed inside the controlled corporate environment
- Security-oriented code review
- Code generation
- Code explanation
- Test generation
- Defense-in-depth secret redaction
- HTTPS + internal endpoint allowlist
- Workspace trust requirement

## Important architecture note

The presentation does not define the exact internal LLM API, authentication method,
model name, or corporate network domain. This prototype therefore uses an
OpenAI-compatible `POST /chat/completions`-style interface as an adapter.

Before production, replace the endpoint validation and authentication with the
actual Deutsche Telekom/T-Systems identity, network and API gateway controls.

## Run

```bash
npm install
npm run compile
```

Open the project in VS Code and press `F5` to start the Extension Development Host.

Configure:

```json
{
  "tcode.endpoint": "https://YOUR-INTERNAL-ENDPOINT/v1/chat/completions",
  "tcode.model": "YOUR-INTERNAL-MODEL"
}
```

## Commands

Open the VS Code Command Palette:

- `T-Code: Generate Code`
- `T-Code: Security Review`
- `T-Code: Explain Selection`
- `T-Code: Generate Tests`

For review/explain/test commands, select code first. If nothing is selected,
the complete current file is used.

## Production hardening

A production implementation should additionally integrate:

1. Corporate SSO / workload identity instead of static API keys.
2. mTLS or private network connectivity where required.
3. Central audit logging without storing source code unnecessarily.
4. DLP/secret scanning before transmission.
5. Repository/project classification and policy enforcement.
6. Tenant/client isolation.
7. Rate limiting and quotas.
8. Prompt-injection defenses.
9. Model/version governance.
10. Security telemetry and incident response.
11. Automated tests for data leakage and policy bypass.
12. A strict allowlist for approved internal LLM endpoints.

## Architecture

```text
Developer
   |
   v
VS Code
   |
   v
T-Code Extension (TypeScript)
   |-- secret redaction
   |-- workspace trust
   |-- endpoint allowlist
   |-- prompt policies
   |
   v
Corporate API Gateway
   |
   v
Internal LLM
   |
   v
Response
   |
   v
VS Code
```
