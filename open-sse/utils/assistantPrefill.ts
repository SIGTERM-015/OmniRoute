export function hasTextContent(msg: Record<string, unknown> | null | undefined): boolean {
  if (!msg) return false;

  // OpenAI format simple text or Anthropic simple text
  if (typeof msg.content === "string") {
    return msg.content.length > 0;
  }

  // Anthropic format array or OpenAI vision array
  if (Array.isArray(msg.content)) {
    return msg.content.some((part: Record<string, unknown> | string | null | undefined) => {
      if (typeof part === "string") return part.length > 0;
      if (!part || typeof part !== "object") return false;
      // Check for text type parts (matches both OpenAI and Anthropic)
      if (part.type === "text" && typeof part.text === "string" && part.text.length > 0) {
        return true;
      }
      return false;
    });
  }

  return false;
}

export function dropTrailingAssistantPrefill<T extends any[]>(messages: T | unknown): T | unknown {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  let end = messages.length;

  while (end > 1) {
    const msg = messages[end - 1];
    if (msg?.role !== "assistant") break;

    // If it only has tool_calls (or no text content), we do NOT trim it
    if (!hasTextContent(msg as Record<string, unknown>)) break;

    end--;
  }

  return end === messages.length ? messages : messages.slice(0, end) as T;
}
