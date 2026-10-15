import { describe, expect, it } from 'vitest';
import { FEATURE_GROUPS } from './FEATURE_GROUPS';

const DASHES = /—|–|--/u;

describe('FEATURE_GROUPS', () => {
  it('names every feature once', () => {
    const titles = FEATURE_GROUPS.flatMap((group) =>
      group.features.map((feature) => feature.title),
    );

    expect(new Set(titles).size).toBe(titles.length);
  });

  it('says where to turn on every feature that is off from the start', () => {
    for (const feature of FEATURE_GROUPS.flatMap((group) => group.features)) {
      expect(feature.isOnByDefault || feature.turnOn !== undefined, feature.title).toBe(true);
    }
  });

  it('describes every feature in a sentence or two, without a dash for punctuation', () => {
    for (const feature of FEATURE_GROUPS.flatMap((group) => group.features)) {
      const sentences = feature.description.split(/[.!?](?:\s|$)/u).filter(Boolean);

      expect(sentences.length, feature.title).toBeLessThanOrEqual(2);
      expect(feature.description, feature.title).not.toMatch(DASHES);
    }
  });
});
