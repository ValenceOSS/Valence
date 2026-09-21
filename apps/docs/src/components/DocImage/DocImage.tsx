import type { ImgHTMLAttributes } from 'react';

/**
 * Draws a screenshot as a figure, captioned with the sentence the author wrote to describe it.
 *
 * Built from spans because an image on its own line is wrapped in a paragraph, and a figure inside
 * one is not valid.
 *
 * @param src - Where the image is.
 * @param alt - What it shows, which is also its caption.
 */
const DocImage = ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => (
  <span className="my-8 block">
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      className="w-full rounded-xl border border-border shadow-[var(--shadow-cast)]"
    />

    {alt === undefined || alt === '' ? null : (
      <span className="mt-3 block text-center text-sm text-text-muted">{alt}</span>
    )}
  </span>
);

DocImage.displayName = 'DocImage';

export { DocImage };
