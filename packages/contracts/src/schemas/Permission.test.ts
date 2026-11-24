import { describe, expect, it } from 'vitest';
import {
  GrantedPermissionOrRetiredSchema,
  MyPermissionsReadSchema,
  PERMISSIONS,
  PermissionOrRetiredSchema,
  RETIRED_PERMISSIONS,
  RETIRED_PERMISSION_NAMES,
} from './Permission';

describe('RETIRED_PERMISSIONS', () => {
  it('hands every retired name to a permission that still exists', () => {
    expect(
      RETIRED_PERMISSION_NAMES.every((retired) =>
        PERMISSIONS.some((one) => one === RETIRED_PERMISSIONS[retired]),
      ),
    ).toBe(true);
  });

  it('never retires a name that is still current', () => {
    const current = new Set<string>(PERMISSIONS);

    expect(RETIRED_PERMISSION_NAMES.some((retired) => current.has(retired))).toBe(false);
  });
});

describe('PermissionOrRetiredSchema', () => {
  it('reads a current permission as itself', () => {
    expect(PermissionOrRetiredSchema.parse('library.edit')).toBe('library.edit');
    expect(PermissionOrRetiredSchema.parse('streaming.control')).toBe('streaming.control');
  });

  it('reads a retired name as the permission that took it over', () => {
    expect(PermissionOrRetiredSchema.parse('library.create')).toBe('library.edit');
    expect(PermissionOrRetiredSchema.parse('jobs.schedule')).toBe('jobs.run');
    expect(PermissionOrRetiredSchema.parse('media.hide')).toBe('media.override');
    expect(PermissionOrRetiredSchema.parse('streaming.pause')).toBe('streaming.control');
    expect(PermissionOrRetiredSchema.parse('server.logs')).toBe('server.monitor');
  });

  it('does not carry over a retired name whose successor does more than it did', () => {
    for (const widening of [
      'account.ban',
      'account.security',
      'account.profiles',
      'server.webhooks',
    ]) {
      expect(PermissionOrRetiredSchema.safeParse(widening).success).toBe(false);
    }
  });

  it('refuses a name that never existed, and a plugin node', () => {
    expect(PermissionOrRetiredSchema.safeParse('library.burn').success).toBe(false);
    expect(PermissionOrRetiredSchema.safeParse('plugin.weather.read').success).toBe(false);
  });
});

describe('GrantedPermissionOrRetiredSchema', () => {
  it('reads a retired name as the permission that took it over', () => {
    expect(GrantedPermissionOrRetiredSchema.parse('media.rescan')).toBe('media.override');
    expect(GrantedPermissionOrRetiredSchema.parse('streaming.stop')).toBe('streaming.control');
    expect(GrantedPermissionOrRetiredSchema.safeParse('account.security').success).toBe(false);
  });

  it('keeps a current permission and a plugin node as they are', () => {
    expect(GrantedPermissionOrRetiredSchema.parse('sources.play')).toBe('sources.play');
    expect(GrantedPermissionOrRetiredSchema.parse('plugin.weather.read')).toBe(
      'plugin.weather.read',
    );
  });

  it('refuses a name that never existed', () => {
    expect(GrantedPermissionOrRetiredSchema.safeParse('server.burn').success).toBe(false);
  });
});

describe('MyPermissionsReadSchema', () => {
  it('reads retired names as the permissions that took them over', () => {
    expect(
      MyPermissionsReadSchema.parse({
        permissions: ['server.logs', 'jobs.schedule'],
        isAdministrator: false,
      }).permissions,
    ).toEqual(['server.monitor', 'jobs.run']);
  });

  it('names each permission once where a retired name and its successor both arrive', () => {
    expect(
      MyPermissionsReadSchema.parse({
        permissions: ['streaming.stop', 'streaming.pause', 'streaming.control', 'requests.ask'],
        newerPermissions: ['streaming.control', 'sources.play'],
        isAdministrator: false,
      }).permissions,
    ).toEqual(['streaming.control', 'requests.ask', 'sources.play']);
  });

  it('keeps plugin nodes and drops names it does not know', () => {
    expect(
      MyPermissionsReadSchema.parse({
        permissions: ['plugin.weather.read', 'library.burn'],
        newerPermissions: ['a.permission.from.the.future'],
        isAdministrator: true,
        isDemo: false,
      }),
    ).toEqual({ permissions: ['plugin.weather.read'], isAdministrator: true, isDemo: false });
  });
});
