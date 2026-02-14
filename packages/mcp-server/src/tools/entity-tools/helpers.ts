export interface ToolTextResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export function toTextResponse(payload: unknown): ToolTextResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function toErrorResponse(message: string, details?: unknown): ToolTextResponse {
  return {
    content: [
      {
        type: "text",
        text:
          typeof details === "undefined"
            ? message
            : `${message}\n\n${JSON.stringify(details, null, 2)}`,
      },
    ],
    isError: true,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
