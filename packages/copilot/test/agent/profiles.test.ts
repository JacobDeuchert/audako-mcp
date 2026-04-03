import { describe, expect, it } from 'vitest';
import {
  getProfile,
  listCallableProfiles,
  listNonCallableProfiles,
  listProfiles,
  resolveEffectiveTools,
} from '../../src/agent/profiles.js';

describe('agent-profiles', () => {
  it('lists both seeded profiles', () => {
    const profiles = listProfiles();
    const names = profiles.map(profile => profile.name).sort();

    expect(names).toEqual(['explore', 'primary']);
  });

  it('lists only callable profiles for subagent use', () => {
    const callableProfiles = listCallableProfiles();

    expect(callableProfiles).toHaveLength(1);
    expect(callableProfiles[0].name).toBe('explore');
    expect(callableProfiles[0].callableAsSubagent).toBe(true);
  });

  it('does not include non-callable profiles in callable listing', () => {
    const callableProfileNames = listCallableProfiles().map(profile => profile.name);

    expect(callableProfileNames).not.toContain('primary');
  });

  it('lists only non-callable profiles', () => {
    const nonCallableProfiles = listNonCallableProfiles();

    expect(nonCallableProfiles).toHaveLength(1);
    expect(nonCallableProfiles[0].name).toBe('primary');
    expect(nonCallableProfiles[0].callableAsSubagent).toBe(false);
  });

  it('resolves explore profile with read-only capabilities only', () => {
    const exploreProfile = getProfile('explore');

    expect(exploreProfile.callableAsSubagent).toBe(true);
    expect(exploreProfile.allowedToolGroups).toEqual(['read-only', 'skills']);
    expect(exploreProfile.toolAllowlist).toContain('skill');
    expect(exploreProfile.toolAllowlist).not.toContain('create_entity');
    expect(exploreProfile.toolAllowlist).not.toContain('update_entity');
    expect(exploreProfile.toolAllowlist).not.toContain('move_entity');
    expect(exploreProfile.toolAllowlist).not.toContain('ask_question');
  });

  it('throws deterministic errors for invalid profile names', () => {
    expect(() => getProfile('')).toThrowError('Profile name is required');
    expect(() => getProfile('missing')).toThrowError('Unknown agent profile: "missing"');
  });

  it('returns cloned profile objects to prevent registry mutation', () => {
    const firstRead = getProfile('primary');
    firstRead.description = 'changed';
    firstRead.allowedToolGroups = ['read-only'];
    firstRead.toolAllowlist = ['get_session_info'];

    const secondRead = getProfile('primary');

    expect(secondRead.description).toBe('Default full-capability session agent profile.');
    expect(secondRead.allowedToolGroups).toEqual([
      'read-only',
      'mutation',
      'ask-question',
      'skills',
      'delegation',
    ]);
    expect(secondRead.toolAllowlist).toContain('create_entity');
    expect(secondRead.toolAllowlist).toContain('task');
  });

  it('returns all profile tools when requested tools are not provided', () => {
    const profile = getProfile('primary');

    expect(resolveEffectiveTools(profile)).toEqual(profile.toolAllowlist);
  });

  it('applies strict intersection semantics for requested tools', () => {
    const profile = getProfile('primary');

    const effectiveTools = resolveEffectiveTools(profile, [
      'get_session_info',
      'create_entity',
      'not_allowed',
      'get_session_info',
    ]);

    expect(effectiveTools).toEqual(['get_session_info', 'create_entity']);
  });

  it('rejects empty requested tool names', () => {
    const profile = getProfile('primary');

    expect(() => resolveEffectiveTools(profile, [''])).toThrowError(
      'Requested tool names must be non-empty',
    );
  });

  it('ignores forged profile input and resolves from registry by name', () => {
    const forgedExplore = {
      ...getProfile('explore'),
      toolAllowlist: ['create_entity'],
    };

    expect(resolveEffectiveTools(forgedExplore)).not.toContain('create_entity');
  });
});
