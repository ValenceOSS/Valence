import { fireEvent, render } from '@testing-library/react-native';
import { Platform, ScrollView, Text } from 'react-native';
import { z } from 'zod';
import { TitleSpread } from '@ValenceTv/components/TitleSpread/TitleSpread';
import type { TitleSpreadProps } from '@ValenceTv/components/TitleSpread/TitleSpread.types';

const MEDIA_ID = '00000000-0000-4000-8000-000000000001';

const SourceSchema = z.array(z.object({ uri: z.string() }));

const aSpread = (overrides: Partial<TitleSpreadProps> = {}): TitleSpreadProps => ({
  mediaId: MEDIA_ID,
  name: 'Dune',
  hasLogo: false,
  stillPath: `/api/media/${MEDIA_ID}/image/backdrop`,
  facts: '2021 · 2h 35m · Science Fiction',
  badges: ['4K', 'Dolby Vision'],
  tagline: 'Beyond fear, destiny awaits.',
  overview: 'A noble family becomes embroiled in a war.',
  credits: ['Starring Timothée Chalamet', 'Directed by Denis Villeneuve'],
  children: <Text>Play</Text>,
  ...overrides,
});

type Drawn = Awaited<ReturnType<typeof render>>;

const picturesIn = (drawn: Drawn): string[] =>
  (drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? []).flatMap(
    (node) => SourceSchema.parse(node.props.source).map((source) => source.uri),
  );

jest.mock('@ValenceTv/platform/useTheScreen', () => ({
  useTheScreen: () => ({ width: 1920, height: 1080 }),
}));

/**
 * The page's own scrolling view, as the television draws it.
 *
 * @param drawn - The drawn title.
 * @returns The view.
 */
const thePageOf = (drawn: Awaited<ReturnType<typeof render>>) => {
  const root = drawn.root;
  const page =
    root?.type === 'RCTScrollView'
      ? root
      : root?.queryAll((node) => node.type === 'RCTScrollView')[0];

  if (page === undefined) {
    throw new Error('The page did not scroll.');
  }

  return page;
};

describe('TitleSpread', () => {
  const was = Platform.OS;

  afterEach(() => {
    jest.restoreAllMocks();
    Platform.OS = was;
  });

  it('writes everything about the title', async () => {
    const drawn = await render(<TitleSpread {...aSpread()} />);

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
    expect(drawn.getByText('2021 · 2h 35m · Science Fiction')).toBeOnTheScreen();
    expect(drawn.getByText('4K')).toBeOnTheScreen();
    expect(drawn.getByText('Dolby Vision')).toBeOnTheScreen();
    expect(drawn.getByText('Beyond fear, destiny awaits.')).toBeOnTheScreen();
    expect(drawn.getByText('A noble family becomes embroiled in a war.')).toBeOnTheScreen();
    expect(drawn.getByText('Starring Timothée Chalamet')).toBeOnTheScreen();
    expect(drawn.getByText('Directed by Denis Villeneuve')).toBeOnTheScreen();
  });

  it('lists what can be done with it, and what carries on beneath', async () => {
    const drawn = await render(<TitleSpread {...aSpread({ below: <Text>Season 1</Text> })} />);

    expect(drawn.getByText('Play')).toBeOnTheScreen();
    expect(drawn.getByText('Season 1')).toBeOnTheScreen();
  });

  it('leaves out a tagline or an overview it does not have', async () => {
    const drawn = await render(
      <TitleSpread {...aSpread({ tagline: '', overview: null, credits: [] })} />,
    );

    expect(drawn.queryByText('Beyond fear, destiny awaits.')).toBeNull();
    expect(drawn.queryByText('A noble family becomes embroiled in a war.')).toBeNull();
    expect(drawn.queryByText('Starring Timothée Chalamet')).toBeNull();
  });

  it('letters the title with its logo where it has one', async () => {
    const drawn = await render(<TitleSpread {...aSpread({ hasLogo: true })} />);

    expect(drawn.queryByText('Dune')).toBeNull();
    expect(picturesIn(drawn)).toContain(`/api/media/${MEDIA_ID}/image/logo?at=full`);
  });

  it('shows its picture behind it', async () => {
    const drawn = await render(<TitleSpread {...aSpread()} />);

    expect(picturesIn(drawn)).toContain(`/api/media/${MEDIA_ID}/image/backdrop`);
  });

  it('shows the picture still and the name in words for a title the library does not have', async () => {
    const drawn = await render(
      <TitleSpread
        {...aSpread({ mediaId: null, hasLogo: true, stillPath: 'https://images.example/dune.jpg' })}
      />,
    );

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
    expect(picturesIn(drawn)).toEqual(['https://images.example/dune.jpg']);
  });

  it('brings the page back to its top as the remote lands on the first action', async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    const drawn = await render(
      <TitleSpread
        {...aSpread({
          children: [<Text key="play">Play</Text>, <Text key="hide">Hide</Text>],
          below: <Text>Season 1</Text>,
        })}
      />,
    );

    await fireEvent(drawn.getByText('Play'), 'focus');

    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  });

  it('leaves the page where it is as the remote lands on any other action', async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    const drawn = await render(
      <TitleSpread
        {...aSpread({
          children: [<Text key="play">Play</Text>, <Text key="hide">Hide</Text>],
          below: <Text>Season 1</Text>,
        })}
      />,
    );

    scrollTo.mockClear();
    await fireEvent(drawn.getByText('Hide'), 'focus');

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('has the Apple TV land the page at its top in the same move that reaches the first action', async () => {
    Platform.OS = 'ios';

    const drawn = await render(<TitleSpread {...aSpread({ below: <Text>Season 1</Text> })} />);
    const actions = drawn.root?.queryAll((node) => typeof node.props.onLayout === 'function');

    await fireEvent(actions?.at(-1) ?? thePageOf(drawn), 'layout', {
      nativeEvent: { layout: { x: 0, y: 512, width: 1830, height: 400 } },
    });

    expect(thePageOf(drawn).props.snapToAlignment).toBe('item');
    expect(
      drawn.root?.queryAll((node) => node.props.scrollSnapOffset === 512).length,
    ).toBeGreaterThan(0);
  });

  it('leaves Android TV to scroll as it always does', async () => {
    Platform.OS = 'android';

    const drawn = await render(<TitleSpread {...aSpread({ below: <Text>Season 1</Text> })} />);

    expect(thePageOf(drawn).props.snapToAlignment).toBeUndefined();
  });
});
