import { DeterministicEvaluation } from "./changeEvidence.schema.js";
import { validateGroundedSynthesis } from "./groundingValidator.js";
import { SynthesisEnvelope, GroundedSynthesisResult } from "./synthesis.schema.js";

export interface SynthesisProvider { generate(envelope: SynthesisEnvelope, signal: AbortSignal): Promise<unknown>; }

export class ResponsesApiProvider implements SynthesisProvider {
  constructor(private readonly config: { apiKey: string; model: string; endpoint?: string }) {}
  async generate(envelope: SynthesisEnvelope, signal: AbortSignal): Promise<unknown> {
    const response = await fetch(this.config.endpoint ?? "https://api.openai.com/v1/responses", {
      method: "POST", signal, headers: { "content-type": "application/json", authorization: `Bearer ${this.config.apiKey}` },
      body: JSON.stringify({ model: this.config.model, input: envelope.fixedInstructions + "\n" + JSON.stringify(envelope), text: { format: { type: "json_object" } } })
    });
    if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
    const body = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text = body.output_text ?? body.output?.flatMap(x => x.content ?? []).map(x => x.text ?? "").join("");
    if (!text) throw new Error("Provider response did not contain JSON text.");
    return JSON.parse(text);
  }
}

export async function runSynthesis(envelope: SynthesisEnvelope, deterministic: DeterministicEvaluation, provider: SynthesisProvider, timeoutMs = 10000): Promise<GroundedSynthesisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const raw = await provider.generate(envelope, controller.signal);
    return validateGroundedSynthesis(raw, envelope, deterministic);
  } catch (error) {
    return { status: "failed-closed", errors: [error instanceof Error && error.name === "AbortError" ? "Provider timed out." : `Provider unavailable or malformed: ${error instanceof Error ? error.message : "unknown error"}.`] };
  } finally { clearTimeout(timeout); }
}
