import type { ReactElement } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { z } from 'zod';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarCard } from '@ValenceTv/screens/CalendarPage/components/CalendarCard/CalendarCard';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const SourceSchema = z.array(z.object({ uri: z.string() }));

const draw = (drawing: ReactElement) => render(drawing, { wrapper: CacheScope });

type Drawn = Awaited<ReturnType<typeof draw>>;

const pictureIn = (drawn: Drawn) => {
  const [picture] =
    drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? [];

  return SourceSchema.parse(picture?.props.source)[0]?.uri;
};

const EPISODE = 'A Show   ·   S2 E5 · Fifth   ·   Not out yet';

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CalendarCard', () => {
  it('names the episode and where it has got to', async () => {
    const drawn = await draw(
      <CalendarCard
        entry={aCalendarEntry()}
        hasPreferredFocus={false}
        onFocus={jest.fn()}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('A Show')).toBeTruthy();
    expect(drawn.getByText('S2 E5 · Fifth')).toBeTruthy();
    expect(drawn.getByText('Not out yet')).toBeTruthy();
    expect(drawn.getByRole('button', { name: EPISODE })).toBeTruthy();
  });

  it('says which release of a film it is, and who asked for it', async () => {
    const drawn = await draw(
      <CalendarCard
        entry={aCalendarEntry({
          title: 'Dune',
          episode: null,
          release: 'physical',
          state: 'wanted',
          source: 'request',
          requestedBy: { id: 'sam', name: 'Sam' },
        })}
        hasPreferredFocus={false}
        onFocus={jest.fn()}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('On disc')).toBeTruthy();
    expect(drawn.getByText('Missing   ·   Sam')).toBeTruthy();
  });

  it('shows a still from the episode where the catalogue has one', async () => {
    const drawn = await draw(
      <CalendarCard
        entry={aCalendarEntry({
          episode: { seasonNumber: 2, episodeNumber: 5, title: 'Fifth', stillUrl: '/still.jpg' },
        })}
        hasPreferredFocus={false}
        onFocus={jest.fn()}
        onPress={jest.fn()}
      />,
    );

    expect(pictureIn(drawn)).toBe('/still.jpg');
  });

  it('shows the title’s backdrop where the episode has no still', async () => {
    const entry = aCalendarEntry();
    const drawn = await draw(
      <CalendarCard
        entry={entry}
        hasPreferredFocus={false}
        onFocus={jest.fn()}
        onPress={jest.fn()}
      />,
    );

    expect(pictureIn(drawn)).toBe(
      `/api/media/${entry.artworkMediaId}/image/backdrop?of=title&size=medium`,
    );
  });

  it('hands over the entry when the remote rests on it and when it is chosen', async () => {
    const onFocus = jest.fn();
    const onPress = jest.fn();
    const entry = aCalendarEntry();
    const drawn = await draw(
      <CalendarCard entry={entry} hasPreferredFocus onFocus={onFocus} onPress={onPress} />,
    );

    await fireEvent(drawn.getByRole('button', { name: EPISODE }), 'focus');
    await userEvent.press(drawn.getByRole('button', { name: EPISODE }));

    expect(onFocus).toHaveBeenCalledWith(entry);
    expect(onPress).toHaveBeenCalledWith(entry);
  });
});
