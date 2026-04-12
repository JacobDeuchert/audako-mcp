export function isAssistantMessage(message) {
    if (!message || typeof message !== 'object') {
        return false;
    }
    const candidate = message;
    return (candidate.role === 'assistant' &&
        Array.isArray(candidate.content) &&
        typeof candidate.stopReason === 'string');
}
//# sourceMappingURL=message-utils.js.map