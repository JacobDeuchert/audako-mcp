import { describe, expect, it } from 'vitest';
import { MutationPermissions } from '../mutation-permissions.js';

describe('MutationPermissions', () => {
  it('returns false for entity types that were never granted', () => {
    const permissions = new MutationPermissions();

    expect(permissions.hasPermission('Signal')).toBe(false);
  });

  it('returns true after permission is granted', () => {
    const permissions = new MutationPermissions();

    permissions.grantPermission('Signal');

    expect(permissions.hasPermission('Signal')).toBe(true);
  });

  it('returns false again after permission is revoked', () => {
    const permissions = new MutationPermissions();

    permissions.grantPermission('Signal');
    permissions.revokePermission('Signal');

    expect(permissions.hasPermission('Signal')).toBe(false);
  });

  it('tracks permissions independently per entity type', () => {
    const permissions = new MutationPermissions();

    permissions.grantPermission('Signal');

    expect(permissions.hasPermission('Signal')).toBe(true);
    expect(permissions.hasPermission('Group')).toBe(false);
  });
});
