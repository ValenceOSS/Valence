import { z } from 'zod';

const IconDocumentSchema = z.looseObject({
  groups: z.array(z.looseObject({ layers: z.array(z.looseObject({})) })),
});

type Restyle = { background?: string; isArtworkHidden?: boolean };

/**
 * Rewrites an Icon Composer document with a different background, or with its artwork hidden,
 * leaving every other choice the designer made alone.
 *
 * @param document - The bundle's `icon.json`, as text.
 * @param restyle - The background to paint instead, as an Icon Composer colour such as
 *   `extended-srgb:0,0,0,1`, and whether to hide every layer so only the background is drawn.
 * @returns The rewritten `icon.json`.
 * @throws If the text is not an Icon Composer document.
 */
const restyleIcon = (document: string, restyle: Restyle): string => {
  const icon = IconDocumentSchema.parse(JSON.parse(document));

  return JSON.stringify(
    {
      ...icon,
      ...(restyle.background === undefined ? {} : { fill: { solid: restyle.background } }),
      groups: icon.groups.map((group) => ({
        ...group,
        layers: group.layers.map((layer) =>
          restyle.isArtworkHidden === true ? { ...layer, hidden: true } : layer,
        ),
      })),
    },
    null,
    2,
  );
};

export type { Restyle };

export { restyleIcon };
