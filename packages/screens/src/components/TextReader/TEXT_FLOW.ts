const TEXT_FLOW = [
  'h-full [hyphens:auto] [&_:is(p,figcaption,blockquote)]:[font-family:inherit] [&_:is(p,figcaption,blockquote)]:tracking-normal',
  '[&_p]:mb-[0.8em] [&_h1]:mb-[0.6em] [&_h1]:text-[1.6em] [&_h1]:font-semibold [&_h2]:mb-[0.6em] [&_h2]:text-[1.35em] [&_h2]:font-semibold [&_h3]:mb-[0.5em] [&_h3]:text-[1.15em] [&_h3]:font-semibold',
  '[&_img]:mx-auto [&_img]:my-[0.8em] [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:max-h-[var(--page-height)] [&_img]:[break-inside:avoid]',
  '[&_blockquote]:mx-[1.5em] [&_blockquote]:italic [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-[1.25em] [&_ul]:list-disc [&_ol]:list-decimal [&_figcaption]:text-center [&_figcaption]:text-[0.85em]',
].join(' ');

export { TEXT_FLOW };
