import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { z } from 'zod';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const aTitle = (n: number, title: string): MediaSummary => ({
  id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title,
  year: 2021,
  durationSeconds: 6000,
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-09-23T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
});

const DUNE = aTitle(1, 'Dune');

const ARRIVAL = aTitle(2, 'Arrival');

const FillSchema = z.object({ backgroundColor: z.string(), flex: z.number() });

const NO_PROGRESS: ReadonlyMap<string, WatchProgress> = new Map();

type Drawn = Awaited<ReturnType<typeof render>>;

const progressShown = (drawn: Drawn): number[] =>
  (drawn.root?.queryAll((node) => node.props.style !== undefined) ?? []).flatMap((node) => {
    const style = FillSchema.safeParse(StyleSheet.flatten(node.props.style));

    return style.success && style.data.backgroundColor === '#3a8ee8' ? [style.data.flex] : [];
  });

describe('Shelf', () => {
  it('names the row and shows its titles', async () => {
    const drawn = await render(
      <Shelf
        title="Recently added"
        items={[DUNE, ARRIVAL]}
        progress={NO_PROGRESS}
        onOpen={jest.fn()}
      />,
    );

    expect(drawn.getByText('Recently added')).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Dune' })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Arrival' })).toBeOnTheScreen();
  });

  it('says which title was chosen', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <Shelf
        title="Recently added"
        items={[DUNE, ARRIVAL]}
        progress={NO_PROGRESS}
        onOpen={onOpen}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Arrival' }));

    expect(onOpen).toHaveBeenCalledWith(ARRIVAL);
  });

  it('says which title the remote is on', async () => {
    const onFocus = jest.fn();
    const drawn = await render(
      <Shelf
        title="Recently added"
        items={[DUNE]}
        progress={NO_PROGRESS}
        onOpen={jest.fn()}
        onFocus={onFocus}
      />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    expect(onFocus).toHaveBeenCalledWith(DUNE);
  });

  it('says how far through each title this viewer is', async () => {
    const progress = new Map<string, WatchProgress>([
      [
        DUNE.id,
        {
          mediaId: DUNE.id,
          positionSeconds: 1500,
          durationSeconds: 6000,
          isFinished: false,
          updatedAt: '2026-09-23T00:00:00.000Z',
        },
      ],
    ]);
    const drawn = await render(
      <Shelf
        title="Continue watching"
        items={[DUNE, ARRIVAL]}
        progress={progress}
        onOpen={jest.fn()}
      />,
    );

    expect(progressShown(drawn)).toEqual([0.25]);
  });

  it('names episodes for their programme and says which they are', async () => {
    const episode = {
      ...aTitle(3, 'Pilot'),
      seriesTitle: 'Severance',
      seasonNumber: 1,
      episodeNumber: 1,
    };
    const drawn = await render(
      <Shelf
        title="Next up"
        items={[episode]}
        progress={NO_PROGRESS}
        onOpen={jest.fn()}
        areEpisodes
      />,
    );

    expect(drawn.getByRole('button', { name: 'Severance' })).toBeOnTheScreen();
    expect(drawn.getByText('S1 · E1  Pilot')).toBeOnTheScreen();
  });

  it('draws again when it is handed different titles or a different name', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <Shelf title="Recently added" items={[DUNE]} progress={NO_PROGRESS} onOpen={onOpen} />,
    );

    await drawn.rerender(
      <Shelf title="Just added" items={[DUNE, ARRIVAL]} progress={NO_PROGRESS} onOpen={onOpen} />,
    );

    expect(drawn.getByText('Just added')).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Arrival' })).toBeOnTheScreen();
  });

  it('keeps what it drew when handed the same titles again in a new list', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <Shelf title="Recently added" items={[DUNE]} progress={NO_PROGRESS} onOpen={onOpen} />,
    );

    await drawn.rerender(
      <Shelf
        title="Recently added"
        items={[{ ...DUNE, title: 'Dune: Part One' }]}
        progress={NO_PROGRESS}
        onOpen={onOpen}
      />,
    );

    expect(drawn.getByRole('button', { name: 'Dune' })).toBeOnTheScreen();
  });
});
