function stringifyPayload(payload) {
    if (typeof payload === 'string') {
        return payload;
    }
    const json = JSON.stringify(payload, null, 2);
    return typeof json === 'string' ? json : String(payload);
}
export function toTextResponse(payload) {
    return {
        content: [
            {
                type: 'text',
                text: stringifyPayload(payload),
            },
        ],
    };
}
export function toErrorResponse(message, details) {
    return {
        content: [
            {
                type: 'text',
                text: typeof details === 'undefined' ? message : `${message}\n\n${stringifyPayload(details)}`,
            },
        ],
        isError: true,
    };
}
export function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
//# sourceMappingURL=helpers.js.map