import { createElement as mockCreateElement } from 'react';
import type { ReactNode } from 'react';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Pressable as mockPressable, Text as mockText } from 'react-native';
import { useIsOnTop as mockUseIsOnTop } from '@ValenceMobile/hooks/useIsOnTop';
import { APageInTheStack } from './APageInTheStack';
import type { TheWaysOut } from './APageInTheStack.types';

const mockDrawn = jest.fn();

jest.mock('@ValenceMobile/components/ATitle/ATitle', () => ({
  ATitle: (props: { mediaId: string; onLookAtPerson: (personId: number) => void }) => {
    mockDrawn(props.mediaId);

    return mockCreateElement(
      mockPressable,
      {
        accessibilityRole: 'button',
        onPress: () => {
          props.onLookAtPerson(7);
        },
      },
      mockCreateElement(
        mockText,
        null,
        `${props.mediaId}${mockUseIsOnTop() ? ' on top' : ' covered'}`,
      ),
    );
  },
}));

jest.mock('@ValenceMobile/components/TheMusicPlayer/TheMusicPlayer', () => ({
  TheMusicPlayer: (props: { watchParty?: object }) =>
    mockCreateElement(mockText, null, props.watchParty === undefined ? 'alone' : 'in a party'),
}));

jest.mock('@ValenceMobile/components/AMusicPage/AMusicPage', () => ({
  AMusicPage: ({ children }: { children?: ReactNode }) => children,
}));

/**
 * Ways out of a page, each one a mock.
 *
 * @returns The ways.
 */
const someWays = (): TheWaysOut => ({
  open: jest.fn(),
  swap: jest.fn(),
  back: jest.fn(),
  watch: jest.fn(),
  watchFromWhereLeft: jest.fn(),
  watchTogether: jest.fn(),
  watchHeld: jest.fn(),
  join: jest.fn(),
  lookAt: jest.fn(),
  lookAtShow: jest.fn(),
  askAbout: jest.fn(),
  requestMore: jest.fn(),
  toAlbum: jest.fn(),
  toArtist: jest.fn(),
  toPlaylist: jest.fn(),
  toTheVideoRemote: jest.fn(),
  toTheListeningPlayer: jest.fn(),
  openWhatIsHeard: jest.fn(),
  signOut: jest.fn(),
  goElsewhere: jest.fn(),
});

const A_TITLE = { kind: 'title', mediaId: 'arrival' } as const;

beforeEach(() => {
  mockDrawn.mockClear();
});

describe('APageInTheStack', () => {
  it('draws the page, and opens what it asks for through the ways out of it', async () => {
    const ways = someWays();

    await render(
      <APageInTheStack
        page={A_TITLE}
        ways={ways}
        isCovered={false}
        mayRequest={false}
        watchParty={null}
      />,
    );

    await userEvent.press(screen.getByRole('button'));

    expect(ways.open).toHaveBeenCalledWith({ kind: 'person', personId: 7 });
  });

  it('tells the page it is not on top while the player is over it', async () => {
    await render(
      <APageInTheStack page={A_TITLE} ways={someWays()} isCovered mayRequest watchParty={null} />,
    );

    expect(screen.getByText('arrival covered')).toBeTruthy();
  });

  it('is not drawn again when nothing it is drawn from has changed', async () => {
    const ways = someWays();
    const drawn = await render(
      <APageInTheStack page={A_TITLE} ways={ways} isCovered={false} mayRequest watchParty={null} />,
    );

    await act(async () => {
      await drawn.rerender(
        <APageInTheStack
          page={A_TITLE}
          ways={ways}
          isCovered={false}
          mayRequest
          watchParty={null}
        />,
      );
    });

    expect(mockDrawn).toHaveBeenCalledTimes(1);
  });

  it('plays music alone where there is no party to follow', async () => {
    await render(
      <APageInTheStack
        page={{ kind: 'playing' }}
        ways={someWays()}
        isCovered={false}
        mayRequest
        watchParty={null}
      />,
    );

    expect(screen.getByText('alone')).toBeTruthy();
  });
});
