import type { TasteVector } from './TasteVector';
import type { TitleTraits } from './TitleTraits';
import { unitOf } from './unitOf';

const CAST_COUNTED = 6;

const CREW_COUNTED = 4;

const KIND_WEIGHTS = { genre: 1, keyword: 1, cast: 0.6, crew: 0.8 } as const;

/**
 * Turns what each title is into a unit vector of its features — genres, keywords, cast and crew —
 * each weighted by how rare it is among the titles, so that sharing something few titles have says
 * more than sharing something most do.
 *
 * @param titles - Each title's traits, by its id.
 * @returns Each title's vector, by its id.
 */
const vectorsOfTitles = (
  titles: ReadonlyMap<string, TitleTraits>,
): ReadonlyMap<string, TasteVector> => {
  const raw = new Map<string, Map<string, number>>();
  const carrying = new Map<string, number>();

  for (const [id, traits] of titles) {
    const features = new Map<string, number>();
    const add = (feature: string, weight: number) => {
      features.set(feature, Math.max(features.get(feature) ?? 0, weight));
    };

    for (const genre of traits.genres) {
      add(`genre:${genre.toLowerCase()}`, KIND_WEIGHTS.genre);
    }

    for (const keyword of traits.keywords) {
      add(`keyword:${keyword.toString()}`, KIND_WEIGHTS.keyword);
    }

    for (const person of traits.cast.slice(0, CAST_COUNTED)) {
      add(`cast:${person.toString()}`, KIND_WEIGHTS.cast);
    }

    for (const person of traits.crew.slice(0, CREW_COUNTED)) {
      add(`crew:${person.toString()}`, KIND_WEIGHTS.crew);
    }

    for (const feature of features.keys()) {
      carrying.set(feature, (carrying.get(feature) ?? 0) + 1);
    }

    raw.set(id, features);
  }

  const rarity = (feature: string) => Math.log(1 + titles.size / (carrying.get(feature) ?? 1));

  return new Map(
    [...raw].map(([id, features]) => [
      id,
      unitOf(
        new Map([...features].map(([feature, weight]) => [feature, weight * rarity(feature)])),
      ),
    ]),
  );
};

export { vectorsOfTitles };
