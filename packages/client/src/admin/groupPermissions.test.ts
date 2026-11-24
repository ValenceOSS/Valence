import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import { groupPermissions } from './groupPermissions';

describe('groupPermissions', () => {
  it('answers nothing for an empty catalogue', () => {
    expect(groupPermissions([])).toEqual([]);
  });

  it('gathers a prefix into one group', () => {
    const groups = groupPermissions(['jobs.run', 'jobs.runDestructive']);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.permissions).toEqual(['jobs.run', 'jobs.runDestructive']);
  });

  it('names a group in words rather than by its prefix', () => {
    expect(groupPermissions(['jobs.run'])[0]?.label).toBe('Jobs');
  });

  it('names every group in the catalogue in words', () => {
    for (const group of groupPermissions([...PERMISSIONS])) {
      expect(group.label).not.toBe(group.id);
    }
  });

  it('keeps different prefixes apart', () => {
    const groups = groupPermissions(['jobs.run', 'server.monitor']);

    expect(groups.map((group) => group.label)).toEqual(['Jobs', 'Server']);
  });

  it('handles a permission with no prefix at all', () => {
    const groups = groupPermissions(['administrator']);

    expect(groups[0]?.label).toBe('Everything');
    expect(groups[0]?.permissions).toEqual(['administrator']);
  });

  it('keeps catalogue order, so Everything does not end up under Accounts', () => {
    const groups = groupPermissions([...PERMISSIONS]);

    expect(groups[0]?.id).toBe('administrator');
  });

  it('covers the whole catalogue without losing one', () => {
    const groups = groupPermissions([...PERMISSIONS]);
    const seen = groups.flatMap((group) => group.permissions);

    expect(seen).toHaveLength(PERMISSIONS.length);
    expect(new Set(seen).size).toBe(PERMISSIONS.length);
  });

  it('shows a group it has no name for rather than hiding it', () => {
    const groups = groupPermissions([...PERMISSIONS]);

    for (const group of groups) {
      expect(group.label).not.toBe('');
    }
  });

  it('gathers what somebody does while watching, whatever its prefix', () => {
    const groups = groupPermissions(['download.media', 'media.subtitles', 'sources.play']);

    expect(groups).toEqual([
      {
        id: 'watching',
        label: 'Watching',
        isAdmin: false,
        permissions: ['download.media', 'media.subtitles', 'sources.play'],
      },
    ]);
  });

  it('keeps holding API keys with their own account rather than running everyone’s', () => {
    const groups = groupPermissions(['account.keys', 'account.manage']);

    expect(groups.map((group) => [group.id, group.isAdmin])).toEqual([
      ['own', false],
      ['account', true],
    ]);
  });

  it('tells running requests and sharing apart from using them', () => {
    const groups = groupPermissions([
      'requests.ask',
      'requests.approve',
      'requests.manage',
      'sharing.link',
      'sharing.manage',
    ]);

    expect(
      groups.map((group) => ({
        id: group.id,
        isAdmin: group.isAdmin,
        permissions: group.permissions,
      })),
    ).toEqual([
      { id: 'requests', isAdmin: false, permissions: ['requests.ask'] },
      { id: 'requestsAdmin', isAdmin: true, permissions: ['requests.approve', 'requests.manage'] },
      { id: 'sharing', isAdmin: false, permissions: ['sharing.link'] },
      { id: 'sharingAdmin', isAdmin: true, permissions: ['sharing.manage'] },
    ]);
  });

  it('marks only the groups about running the server as admin', () => {
    expect(groupPermissions([...PERMISSIONS]).map((group) => [group.id, group.isAdmin])).toEqual([
      ['administrator', false],
      ['watching', false],
      ['sharing', false],
      ['requests', false],
      ['own', false],
      ['requestsAdmin', true],
      ['sharingAdmin', true],
      ['streaming', true],
      ['media', true],
      ['library', true],
      ['jobs', true],
      ['account', true],
      ['server', true],
    ]);
  });
});
