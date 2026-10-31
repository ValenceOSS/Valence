/**
 * Reads the colour a picture tints the ground with where the picture itself is not drawn; a
 * television draws the picture blurred behind the page instead, so there is nothing to read.
 *
 * @param _path - The picture.
 * @returns Nothing.
 */
const readPictureTint = (_path: string): Promise<string | null> => Promise.resolve(null);

export { readPictureTint };
