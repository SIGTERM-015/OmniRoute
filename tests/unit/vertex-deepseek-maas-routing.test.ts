import test from "node:test";
import assert from "node:assert/strict";

import {
  getVertexModelTargetFormat,
  getVertexModelTransport,
  normalizeVertexModelId,
} from "../../open-sse/config/vertexModels.ts";

// Regression guard for the production failure "[400]: Expected input to contain field:
// 'messages'". DeepSeek models on Vertex are served by the OpenAI-compatible MaaS endpoint
// (endpoints/openapi/chat/completions), which requires an OpenAI-shaped body with `messages`.
// When these ids resolved to the Gemini transport the translator produced a Gemini-shaped body
// (contents/parts) instead, and every request to vertex/DeepSeek-V4-* was rejected upstream.

test("DeepSeek MaaS ids normalize to their documented publisher namespace", () => {
  assert.equal(normalizeVertexModelId("DeepSeek-V4-Flash"), "deepseek-ai/DeepSeek-V4-Flash");
  assert.equal(normalizeVertexModelId("DeepSeek-V4-Pro"), "deepseek-ai/DeepSeek-V4-Pro");
});

test("DeepSeek MaaS models use the OpenAI transport, never the Gemini one", () => {
  for (const model of ["DeepSeek-V4-Flash", "DeepSeek-V4-Pro"]) {
    const transport = getVertexModelTransport(model);
    assert.equal(transport, "openai", `${model} must not fall through to another transport`);
    assert.notEqual(transport, "gemini", `${model} on the gemini transport reintroduces the 400`);
  }
});

test("DeepSeek MaaS models request an OpenAI-shaped body (messages, not contents/parts)", () => {
  // A null targetFormat means "native Gemini shape" — the exact bug this guards against.
  assert.equal(getVertexModelTargetFormat("DeepSeek-V4-Flash"), "openai");
  assert.equal(getVertexModelTargetFormat("DeepSeek-V4-Pro"), "openai");
});

test("sibling Vertex families keep their own transports", () => {
  assert.equal(getVertexModelTransport("claude-opus-5"), "anthropic");
  assert.equal(getVertexModelTargetFormat("claude-opus-5"), "claude");

  assert.equal(getVertexModelTransport("gemini-2.5-pro"), "gemini");
  assert.equal(getVertexModelTargetFormat("gemini-2.5-pro"), null);
});

test("DeepSeek routing survives the gateway's vertex/ prefix and resource names", () => {
  for (const model of [
    "vertex/DeepSeek-V4-Flash",
    "publishers/deepseek-ai/models/DeepSeek-V4-Flash",
    "projects/demo/locations/global/publishers/deepseek-ai/models/DeepSeek-V4-Flash",
  ]) {
    assert.equal(getVertexModelTargetFormat(model), "openai", `${model} must stay OpenAI-shaped`);
  }
});
