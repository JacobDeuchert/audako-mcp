export function normalizePathIds(pathValue: unknown, groupId: string): string[] {
  const pathIds = Array.isArray(pathValue)
    ? pathValue.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];

  if (pathIds[pathIds.length - 1] !== groupId) {
    pathIds.push(groupId);
  }

  return pathIds;
}
