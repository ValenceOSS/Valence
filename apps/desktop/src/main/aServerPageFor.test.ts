import { describe, expect, it, vi } from 'vitest';
import { aServerPageFor } from './aServerPageFor';

vi.mock('@ValenceDesktop/main/serveTheApplication', () => ({ ORIGIN: 'valence://app' }));

describe('aServerPageFor', () => {
  it('finds a server page the window was sent to on the server itself, query and all', () => {
    expect(
      aServerPageFor(
        'valence://app/api/plugins/example/accounts/service/connect?ticket=abc',
        'http://localhost:8420',
      ),
    ).toBe('http://localhost:8420/api/plugins/example/accounts/service/connect?ticket=abc');
  });

  it('leaves the application, other sites, and a client with no server alone', () => {
    expect(aServerPageFor('valence://app/library', 'http://localhost:8420')).toBeNull();
    expect(aServerPageFor('valence://app/apis', 'http://localhost:8420')).toBeNull();
    expect(aServerPageFor('https://service.example/api/x', 'http://localhost:8420')).toBeNull();
    expect(aServerPageFor('valence://app/api/plugins/x', '')).toBeNull();
  });
});
