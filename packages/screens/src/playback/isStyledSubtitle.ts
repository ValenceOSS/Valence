const STYLED_FORMATS: ReadonlySet<string> = new Set(['ass', 'ssa']);

/**
 * Whether a subtitle track carries its own lettering and placement — an Advanced SubStation
 * script — and so is drawn as its script says rather than in the viewer's caption style.
 *
 * @param format - The track's format, as the server names it.
 * @returns Whether it styles itself.
 */
const isStyledSubtitle = (format: string): boolean => STYLED_FORMATS.has(format.toLowerCase());

export { isStyledSubtitle };
