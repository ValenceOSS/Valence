import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { theColours } from '@ValenceMobile/theme/theColours';
import { cardTintOf } from '@ValenceMobile/theme/cardTintOf';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';

/**
 * The colour a card is tinted with on a dark page, taken from the foot of a picture where it fades
 * into the card.
 *
 * @param url - The picture, or nothing while there is none.
 * @returns The tint, or nothing on a light page or where the picture gave no colour.
 */
const usePictureTint = (url: string | null): string | null => {
  const colours = useTheColours();
  const lights = usePictureLights(url);

  return colours.surface === theColours.dark.surface ? cardTintOf(lights) : null;
};

export { usePictureTint };
