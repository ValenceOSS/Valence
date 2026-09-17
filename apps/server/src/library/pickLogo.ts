type LogoCandidate = {
  filePath: string;
  language: string | null;
  width: number;
  voteAverage: number;
  voteCount: number;
};

/**
 * Ranks how much each kind of logo language is wanted, so the best available is chosen rather than
 * the first returned. A logo with no lettering at all beats one in a language nobody in the house
 * reads.
 *
 * @param language - The language a catalogue tagged the logo with.
 * @param wanted - The language the house reads.
 * @param original - The language the title was made in.
 * @returns How much it is preferred, lower being better.
 */
const rankLanguage = (language: string | null, wanted: string, original: string | null): number => {
  if (language === wanted) {
    return 0;
  }

  if (language === null) {
    return 1;
  }

  return language === original ? 2 : 3;
};

/** A rating to the tenth it is compared at. */
const round = (rating: number): number => Math.round(rating * 10) / 10;

/**
 * Chooses which of a catalogue's logos to draw a title with, preferring the viewer's language, then
 * one with no lettering, then anything. A logo is the title as its designer set it, so getting the
 * language wrong is worse than showing plain text.
 *
 * Within a language, what people thought of it decides, and the size only breaks a tie nothing else
 * could. It was the other way round, and the size of a file says nothing about whether it is the
 * right picture: a catalogue usually carries both the logo as it was designed and a flat white
 * silhouette of it, and the silhouette is often the larger upload. Kung Fu Panda 4 came out as white
 * blobs on the home screen for exactly that reason — that logo's letters are told apart by their
 * outlines and shading, and filled flat they run into each other.
 *
 * The rating is rounded to a tenth before it is compared, which is Jellyfin's rule and a good one:
 * it stops 5.312 against 5.308 from settling anything and hands the decision to the number of people
 * who voted instead. A logo rated 5.3 by forty people is a safer bet than one rated 5.3 by two.
 *
 * Size stays as the last resort rather than being dropped, which is where Jellyfin leaves it out
 * entirely. Catalogue images are very often unvoted, and where nothing is known about any of them
 * the biggest is a better guess than the first.
 *
 * @param candidates - The logos the catalogue offered, each with its language.
 * @param options - The language the house reads, and the one the title was made in.
 * @returns The logo to use, or null where none were offered.
 */
const pickLogo = (
  candidates: readonly LogoCandidate[],
  options: { language?: string; originalLanguage?: string | null } = {},
): LogoCandidate | null => {
  const wanted = options.language ?? 'en';
  const original = options.originalLanguage ?? null;

  const [best] = [...candidates].sort((left, right) => {
    const byLanguage =
      rankLanguage(left.language, wanted, original) -
      rankLanguage(right.language, wanted, original);

    if (byLanguage !== 0) {
      return byLanguage;
    }

    const byRating = round(right.voteAverage) - round(left.voteAverage);

    return byRating || right.voteCount - left.voteCount || right.width - left.width;
  });

  return best ?? null;
};

export type { LogoCandidate };

export { pickLogo, rankLanguage };
