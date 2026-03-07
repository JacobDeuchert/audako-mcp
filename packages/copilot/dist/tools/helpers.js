function stringifyPayload(payload) {
    if (typeof payload === 'string') {
        return payload;
    }
    const json = JSON.stringify(payload, null, 2);
    return typeof json === 'string' ? json : String(payload);
}
export function toTextResponse(payload, details) {
    return {
        content: [
            {
                type: 'text',
                text: stringifyPayload(payload),
            },
        ],
        details: details,
    };
}
export function toErrorResponse(message, errorDetails, details) {
    return {
        content: [
            {
                type: 'text',
                text: typeof errorDetails === 'undefined'
                    ? message
                    : `${message}\n\n${stringifyPayload(errorDetails)}`,
            },
        ],
        details: details,
    };
}
export function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
//# sourceMappingURL=helpers.js.map