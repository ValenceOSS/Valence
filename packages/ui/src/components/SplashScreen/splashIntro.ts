/**
 * How far the splash screen's opening has got, kept outside any one splash screen so that one
 * drawn in place of another — the application's own handing over to the signed-in one — carries
 * on from where the first had got to rather than starting again.
 */
const splashIntro: { startedAt: number | null } = { startedAt: null };

export { splashIntro };
