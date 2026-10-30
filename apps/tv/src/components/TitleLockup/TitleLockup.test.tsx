import { fireEvent, render } from '@testing-library/react-native';
import { z } from 'zod';
import { TitleLockup } from '@ValenceTv/components/TitleLockup/TitleLockup';

const MEDIA_ID = '00000000-0000-4000-8000-000000000001';

const SourceSchema = z.array(z.object({ uri: z.string() }));

type Drawn = Awaited<ReturnType<typeof render>>;

const pictureNodesIn = (drawn: Drawn) =>
  drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? [];

describe('TitleLockup', () => {
  it('letters the title with its logo', async () => {
    const drawn = await render(<TitleLockup mediaId={MEDIA_ID} name="Dune" hasLogo />);
    const [logo] = pictureNodesIn(drawn);

    expect(SourceSchema.parse(logo?.props.source)).toEqual([
      expect.objectContaining({ uri: `/api/media/${MEDIA_ID}/image/logo?at=full` }),
    ]);
    expect(drawn.queryByText('Dune')).toBeNull();
  });

  it('names a title with no logo in words', async () => {
    const drawn = await render(<TitleLockup mediaId={MEDIA_ID} name="Dune" hasLogo={false} />);

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
    expect(pictureNodesIn(drawn)).toEqual([]);
  });

  it('names a title the library does not have in words', async () => {
    const drawn = await render(<TitleLockup mediaId={null} name="Dune" hasLogo />);

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
  });

  it('letters a title the library does not have with the catalogue’s logo', async () => {
    const drawn = await render(
      <TitleLockup mediaId={null} name="Dune" hasLogo={false} logoPath="/logos/dune.png" />,
    );
    const [logo] = pictureNodesIn(drawn);

    expect(SourceSchema.parse(logo?.props.source)).toEqual([
      expect.objectContaining({ uri: '/logos/dune.png' }),
    ]);
    expect(drawn.queryByText('Dune')).toBeNull();
  });

  it('sits the logo on what follows where it is asked to', async () => {
    const drawn = await render(<TitleLockup mediaId={MEDIA_ID} name="Dune" hasLogo isSeated />);
    const [logo] = pictureNodesIn(drawn);

    expect(logo?.props.contentPosition).toEqual(expect.objectContaining({ left: 0, bottom: 0 }));
  });

  it('falls back to words once the logo will not load', async () => {
    const drawn = await render(<TitleLockup mediaId={MEDIA_ID} name="Dune" hasLogo />);
    const [logo] = pictureNodesIn(drawn);

    expect(pictureNodesIn(drawn)).toHaveLength(1);

    if (logo !== undefined) {
      await fireEvent(logo, 'error', { nativeEvent: { error: 'Not found' } });
    }

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
  });
});
