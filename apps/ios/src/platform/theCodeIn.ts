const A_CODE = /[?&]code=([^&#]+)/u;

/**
 * Reads the code off the address a browser sign-in came back to.
 *
 * Read by hand because React Native's `URL` does not implement `searchParams`.
 *
 * @param address - Where the browser sheet was sent.
 * @returns The code, or null where there is none.
 */
const theCodeIn = (address: string): string | null => {
  const found = A_CODE.exec(address)?.[1];

  return found === undefined ? null : decodeURIComponent(found);
};

export { theCodeIn };
