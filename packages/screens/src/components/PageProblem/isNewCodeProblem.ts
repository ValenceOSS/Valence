/**
 * Whether a page failed because the code it asked for has gone, as it does once a newer release has
 * replaced it or the development server has rebuilt it, rather than for any reason a reload would
 * not mend.
 *
 * @param message - What the failure said, where it said anything.
 * @returns Whether it was code that has gone.
 */
const isNewCodeProblem = (message: string | null): boolean => {
  const said = (message ?? '').toLowerCase();

  return said.includes('dynamically imported module') || said.includes('importing a module script');
};

export { isNewCodeProblem };
