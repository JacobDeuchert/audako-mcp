interface ErrorLogDetails {
  error: string;
  code?: string;
  status?: number;
  statusText?: string;
  method?: string;
  url?: string;
  requestData?: unknown;
  responseData?: unknown;
  causeError?: string;
  stack?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function truncateString(value: string, maxLength: number = 2000): string {
  if (value.length <= maxLength) {
    return value;
  }

  const omittedCharacters = value.length - maxLength;
  return `${value.slice(0, maxLength)}... [truncated ${omittedCharacters} chars]`;
}

function sanitizeLogData(value: unknown): unknown {
  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'undefined') {
    return undefined;
  }

  try {
    JSON.stringify(value);
    return value;
  } catch {
    return '[unserializable response data]';
  }
}

function applyHttpErrorFields(source: Record<string, unknown>, details: ErrorLogDetails): void {
  if (typeof source.code === 'string' && !details.code) {
    details.code = source.code;
  }

  const config = isRecord(source.config) ? source.config : undefined;
  if (config) {
    if (typeof config.method === 'string' && config.method.trim().length > 0 && !details.method) {
      details.method = config.method.toUpperCase();
    }

    if (typeof config.url === 'string' && config.url.trim().length > 0 && !details.url) {
      details.url = config.url;
    }

    if ('data' in config && typeof details.requestData === 'undefined') {
      details.requestData = sanitizeLogData(config.data);
    }
  }

  const response = isRecord(source.response) ? source.response : undefined;
  if (response) {
    if (typeof response.status === 'number' && typeof details.status === 'undefined') {
      details.status = response.status;
    }

    if (
      typeof response.statusText === 'string' &&
      response.statusText.trim().length > 0 &&
      !details.statusText
    ) {
      details.statusText = response.statusText;
    }

    if ('data' in response && typeof details.responseData === 'undefined') {
      details.responseData = sanitizeLogData(response.data);
    }
  }
}

export function toErrorLogDetails(error: unknown): ErrorLogDetails {
  const details: ErrorLogDetails = {
    error: error instanceof Error ? error.message : String(error),
  };

  if (error instanceof Error && error.stack) {
    details.stack = error.stack;
  }

  if (!isRecord(error)) {
    return details;
  }

  if (typeof error.message === 'string') {
    details.error = error.message;
  }

  applyHttpErrorFields(error, details);

  if (typeof error.toJSON === 'function') {
    try {
      const serialized = error.toJSON();
      if (isRecord(serialized)) {
        applyHttpErrorFields(serialized, details);
      }
    } catch {
      // Ignore toJSON issues and continue with available fields.
    }
  }

  const cause = isRecord(error.cause) ? error.cause : undefined;
  if (cause) {
    if (typeof cause.message === 'string') {
      details.causeError = cause.message;
    }

    applyHttpErrorFields(cause, details);
  }

  return details;
}
