import * as vscode from "vscode";
import { LlmRequest, LlmResponse, ChatMessage } from "./types";
import { validateInternalEndpoint } from "./security";

export class InternalLlmClient {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async complete(messages: ChatMessage[]): Promise<string> {
    const config = vscode.workspace.getConfiguration("tcode");

    const endpoint = config.get<string>("endpoint", "");
    const model = config.get<string>("model", "corporate-coder");
    const temperature = config.get<number>("temperature", 0.2);
    const maxTokens = config.get<number>("maxTokens", 2000);

    if (!endpoint) {
      throw new Error("T-Code LLM endpoint is not configured.");
    }

    validateInternalEndpoint(endpoint);

    const apiKey =
      config.get<string>("apiKey", "") ||
      await this.context.secrets.get("tcode.apiKey") ||
      "";

    const body: LlmRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-T-Code-Client": "vscode"
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Internal LLM request failed (${response.status}): ${errorBody.slice(0, 500)}`
      );
    }

    const data = await response.json() as LlmResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("The internal LLM returned an empty response.");
    }

    return content;
  }
}
