import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { z } from 'zod';
import { AFadingInPicture } from './AFadingInPicture';

type Drawn = Awaited<ReturnType<typeof render>>;

const thePictures = (drawn: Drawn) => drawn.root?.queryAll((node) => node.type === 'Image') ?? [];

const FadedSchema = z.object({ opacity: z.number() });

const opacitiesIn = (drawn: Drawn) =>
  (drawn.root?.queryAll((node) => node.type === 'View') ?? []).flatMap((node) => {
    const style = FadedSchema.safeParse(StyleSheet.flatten(node.props.style));

    return style.success ? [style.data.opacity] : [];
  });

describe('AFadingInPicture', () => {
  it('fades its top edge in, from nearly clear to nearly whole', async () => {
    const drawn = await render(
      <AFadingInPicture
        uri="http://one.local/poster"
        top={72}
        height={460}
        fade={72}
        onMissing={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(thePictures(drawn).length).toBeGreaterThan(1);
    });

    const opacities = opacitiesIn(drawn);

    expect(opacities[0]).toBeLessThan(0.05);
    expect(opacities.at(-1)).toBeGreaterThan(0.95);
    expect(opacities).toEqual([...opacities].sort((one, other) => one - other));
  });

  it('says so where the picture cannot be had', async () => {
    const onMissing = jest.fn();
    const drawn = await render(
      <AFadingInPicture
        uri="http://one.local/poster"
        top={72}
        height={460}
        fade={72}
        onMissing={onMissing}
      />,
    );

    const picture = await waitFor(() => {
      const [first] = thePictures(drawn);

      if (first === undefined) {
        throw new Error('No picture yet');
      }

      return first;
    });

    await fireEvent(picture, 'error');

    expect(onMissing).toHaveBeenCalled();
  });
});
