import { describe, expect, it } from 'vitest';
import { PermissionSchema } from './PermissionSchema';

describe('PermissionSchema', () => {
  it('reads every kind of permission', () => {
    const kinds = [
      { kind: 'network', hosts: ['api.spotify.com'] },
      { kind: 'library', access: 'read' },
      { kind: 'viewing', access: 'read' },
      { kind: 'requests', access: 'create' },
      { kind: 'playlists', access: 'write' },
      { kind: 'storage', quotaBytes: 1_000_000 },
      { kind: 'notifications' },
    ].map((permission) => PermissionSchema.parse(permission).kind);

    expect(kinds).toEqual([
      'network',
      'library',
      'viewing',
      'requests',
      'playlists',
      'storage',
      'notifications',
    ]);
  });

  it('refuses write access to the library, and storage over 50 MB', () => {
    expect(PermissionSchema.safeParse({ kind: 'library', access: 'write' }).success).toBe(false);
    expect(PermissionSchema.safeParse({ kind: 'storage', quotaBytes: 60_000_000 }).success).toBe(
      false,
    );
  });

  it('refuses a network permission with no hosts, or a wildcard', () => {
    expect(PermissionSchema.safeParse({ kind: 'network', hosts: [] }).success).toBe(false);
    expect(PermissionSchema.safeParse({ kind: 'network', hosts: ['*.example.com'] }).success).toBe(
      false,
    );
  });
});
