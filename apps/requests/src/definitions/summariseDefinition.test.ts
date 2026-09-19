import { describe, expect, it } from 'vitest';
import { readDefinition } from '@ValenceRequests/cardigann/readDefinition';
import { aDefinitionYaml } from './aDefinitionYaml';
import { summariseDefinition } from './summariseDefinition';

describe('summariseDefinition', () => {
  it('says what a definition is in a few words', () => {
    const yaml = aDefinitionYaml('alpha');
    const definition = readDefinition(yaml);

    expect(
      definition === null
        ? null
        : summariseDefinition(definition, yaml, 'sha1', '2026-09-19T00:00:00.000Z'),
    ).toEqual({
      id: 'alpha',
      name: 'ALPHA',
      description: 'alpha is a tracker',
      language: 'en-US',
      privacy: 'semi-private',
      protocol: 'torrent',
      categories: ['Movies', 'TV'],
      yaml,
      sha: 'sha1',
      fetchedAt: '2026-09-19T00:00:00.000Z',
    });
  });

  it('calls a site of a kind it does not know private', () => {
    const definition = readDefinition(
      aDefinitionYaml('beta').replace('type: semi-private', 'type: invite-only'),
    );

    expect(definition === null ? null : summariseDefinition(definition, '', '', '').privacy).toBe(
      'private',
    );
  });
});
