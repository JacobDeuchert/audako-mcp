export function normalizePathIds(pathValue, groupId) {
    const pathIds = Array.isArray(pathValue)
        ? pathValue.filter((id) => typeof id === 'string' && id.trim().length > 0)
        : [];
    if (pathIds[pathIds.length - 1] !== groupId) {
        pathIds.push(groupId);
    }
    return pathIds;
}
//# sourceMappingURL=path-utils.js.map