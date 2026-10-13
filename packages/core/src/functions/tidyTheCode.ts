/**
 * Puts a typed code into the shape the server issued it in.
 *
 * Somebody copying letters off a television types them however they read them — lower case, with
 * the dash, without it, with a space where the dash was. All of those are the same code, and
 * refusing one of them over punctuation is the sort of thing that sends a person back to the remote.
 *
 * @param typed - What somebody typed.
 * @returns The code as the server knows it.
 */
const tidyTheCode = (typed: string): string => typed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

export { tidyTheCode };
