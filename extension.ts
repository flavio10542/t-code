import * as vscode from "vscode";
import { InternalLlmClient } from "./llmClient";
import {
  redactSecrets,
  assertSafeWorkspace
} from "./security";
import {
  SYSTEM_PROMPT,
  GENERATE_PROMPT,
  REVIEW_PROMPT,
  EXPLAIN_PROMPT,
  TEST_PROMPT
} from "./prompts";

export function activate(context: vscode.ExtensionContext) {
  const client = new InternalLlmClient(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("tcode.generate", async () => {
      await runGenerate(client);
    }),
    vscode.commands.registerCommand("tcode.review", async () => {
      await runSelectionTask(
        client,
        "Security Review",
        (code, language) => REVIEW_PROMPT(code, language)
      );
    }),
    vscode.commands.registerCommand("tcode.explain", async () => {
      await runSelectionTask(
        client,
        "Explanation",
        (code, language) => EXPLAIN_PROMPT(code, language)
      );
    }),
    vscode.commands.registerCommand("tcode.tests", async () => {
      await runSelectionTask(
        client,
        "Generated Tests",
        (code, language) => TEST_PROMPT(code, language)
      );
    })
  );

  vscode.window.setStatusBarMessage("T-Code Secure Agent active", 5000);
}

async function runGenerate(client: InternalLlmClient): Promise<void> {
  try {
    assertSafeWorkspace();

    const request = await vscode.window.showInputBox({
      prompt: "What should T-Code generate?",
      placeHolder: "e.g. Create a TypeScript function that validates JWT claims securely."
    });

    if (!request) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId ?? "unknown";

    const answer = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "T-Code is generating code using the internal LLM..."
      },
      async () => client.complete([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: GENERATE_PROMPT(redactSecrets(request), language)
        }
      ])
    );

    await showResult("T-Code — Generated Code", answer);
  } catch (error) {
    showError(error);
  }
}

async function runSelectionTask(
  client: InternalLlmClient,
  title: string,
  promptBuilder: (code: string, language: string) => string
): Promise<void> {
  try {
    assertSafeWorkspace();

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      throw new Error("Open a source file and select code first.");
    }

    const selection = editor.selection;
    let code = editor.document.getText(selection);

    if (!code.trim()) {
      code = editor.document.getText();
    }

    const language = editor.document.languageId;

    // Redaction is a defense-in-depth measure, not a replacement for
    // secret scanning and corporate DLP controls.
    code = redactSecrets(code);

    const answer = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `T-Code — ${title}...`
      },
      async () => client.complete([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: promptBuilder(code, language) }
      ])
    );

    await showResult(`T-Code — ${title}`, answer);
  } catch (error) {
    showError(error);
  }
}

async function showResult(title: string, content: string): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: "markdown"
  });

  await vscode.window.showTextDocument(
    document,
    vscode.ViewColumn.Beside,
    false
  );

  vscode.window.setStatusBarMessage(`${title} completed`, 3000);
}

function showError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  vscode.window.showErrorMessage(`T-Code: ${message}`);
}

export function deactivate() {}
