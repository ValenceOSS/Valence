/**
 * Lists the WebP copies of a picture at each width it was made in, for an image's `srcSet`, so a
 * browser fetches the smallest that is sharp where it is drawn.
 *
 * @param src - The original picture, such as `/tour/home.jpg`.
 * @param widths - The widths its WebP copies were made at.
 * @returns The `srcSet` value, empty for a picture that has no WebP copies.
 */
const webpSourcesOf = (src: string, widths: readonly number[]): string =>
  /\.(jpg|png)$/u.test(src)
    ? widths
        .map(
          (width) =>
            `${src.replace(/\.(jpg|png)$/u, '')}-${width.toString()}.webp ${width.toString()}w`,
        )
        .join(', ')
    : '';

export { webpSourcesOf };
