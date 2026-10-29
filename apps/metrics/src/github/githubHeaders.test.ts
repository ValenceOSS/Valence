import { afterEach, describe, expect, it, vi } from 'vitest';
import { githubHeaders } from './githubHeaders';

describe('githubHeaders', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('asks for GitHub’s JSON, and nothing more without a token', () => {
    vi.stubEnv('GITHUB_TOKEN', '');

    expect(githubHeaders()).toStrictEqual({ Accept: 'application/vnd.github+json' });
  });

  it('sends the token where the site was given one', () => {
    vi.stubEnv('GITHUB_TOKEN', 'a-token');

    expect(githubHeaders()).toStrictEqual({
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer a-token',
    });
  });
});
