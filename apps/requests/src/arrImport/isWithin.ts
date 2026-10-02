/**
 * Whether one folder is another or inside it, whichever way its slashes lean and whether either
 * ends with one.
 *
 * @param inner - The folder that may be inside.
 * @param outer - The folder that may hold it.
 * @returns Whether it is.
 */
const isWithin = (inner: string, outer: string): boolean => {
  const tidy = (path: string) => {
    const forward = path.replaceAll('\\', '/');

    return forward.length > 1 ? forward.replace(/\/+$/, '') : forward;
  };
  const from = tidy(inner);
  const to = tidy(outer);

  return from === to || from.startsWith(to === '/' ? '/' : `${to}/`);
};

export { isWithin };
