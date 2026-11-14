const STYLED_FORMATS: ReadonlySet<string> = new Set(['ass', 'ssa']);

/**
 * Whether a subtitle track is a script that says where its lines go and what they are dressed in,
 * which only Advanced SubStation and SubStation Alpha do.
 *
 * @param format - The track's format, as the server names it.
 * @returns Whether it has a styled form to ask for.
 */
const isStyledSubtitle = (format: string): boolean => STYLED_FORMATS.has(format.toLowerCase());

export { isStyledSubtitle };
