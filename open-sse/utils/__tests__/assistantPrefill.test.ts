import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dropTrailingAssistantPrefill, hasTextContent } from "../assistantPrefill.ts";

describe("assistantPrefill", () => {
  describe("hasTextContent", () => {
    it("returns true for string content", () => {
      assert.strictEqual(hasTextContent({ content: "Hello" }), true);
    });

    it("returns false for empty string", () => {
      assert.strictEqual(hasTextContent({ content: "" }), false);
    });

    it("returns false for null content", () => {
      assert.strictEqual(hasTextContent({ content: null }), false);
    });

    it("returns true for array with text", () => {
      assert.strictEqual(hasTextContent({ content: [{ type: "text", text: "Hello" }] }), true);
    });

    it("returns false for array with empty text", () => {
      assert.strictEqual(hasTextContent({ content: [{ type: "text", text: "" }] }), false);
    });

    it("returns false for array with only tool_use", () => {
      assert.strictEqual(hasTextContent({ content: [{ type: "tool_use", id: "123", name: "test", input: {} }] }), false);
    });
  });

  describe("dropTrailingAssistantPrefill", () => {
    it("returns original array if it ends with user message", () => {
      const messages = [{ role: "user", content: "Hi" }];
      assert.strictEqual(dropTrailingAssistantPrefill(messages), messages);
    });

    it("trims trailing assistant with text (string)", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" }
      ];
      assert.deepStrictEqual(dropTrailingAssistantPrefill(messages), [{ role: "user", content: "Hi" }]);
    });

    it("trims trailing assistant with text (array)", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: [{ type: "text", text: "Hello" }] }
      ];
      assert.deepStrictEqual(dropTrailingAssistantPrefill(messages), [{ role: "user", content: "Hi" }]);
    });

    it("trims multiple consecutive assistant messages with text", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello 1" },
        { role: "assistant", content: "Hello 2" }
      ];
      assert.deepStrictEqual(dropTrailingAssistantPrefill(messages), [{ role: "user", content: "Hi" }]);
    });

    it("does not trim assistant with only tool_calls (Anthropic format)", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: [{ type: "tool_use", id: "1", name: "test", input: {} }] }
      ];
      assert.strictEqual(dropTrailingAssistantPrefill(messages), messages);
    });

    it("does not trim assistant with only tool_calls (OpenAI format)", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: null, tool_calls: [{ id: "1" }] }
      ];
      assert.strictEqual(dropTrailingAssistantPrefill(messages), messages);
    });

    it("trims assistant after tool_calls if last one is text", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: [{ type: "tool_use", id: "1", name: "test", input: {} }] },
        { role: "tool", content: "result" },
        { role: "assistant", content: "Prefill text" }
      ];
      assert.deepStrictEqual(dropTrailingAssistantPrefill(messages), [
        { role: "user", content: "Hi" },
        { role: "assistant", content: [{ type: "tool_use", id: "1", name: "test", input: {} }] },
        { role: "tool", content: "result" }
      ]);
    });

    it("does not return empty array if all messages are assistant with text", () => {
      const messages = [{ role: "assistant", content: "Hello" }];
      const result = dropTrailingAssistantPrefill(messages);
      assert.deepStrictEqual(result, [{ role: "assistant", content: "Hello" }]);
    });

    it("does not mutate original array", () => {
      const messages = [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" }
      ];
      const result = dropTrailingAssistantPrefill(messages) as any[];
      assert.strictEqual(messages.length, 2);
      assert.strictEqual(result.length, 1);
    });
  });
});
