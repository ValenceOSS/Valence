import { render, waitFor } from '@testing-library/react-native';
import { useContext } from 'react';
import { Text } from 'react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { CARD_ORIGINS } from '@ValenceMobile/components/ACardOrigins/CARD_ORIGINS';
import { ACardOrigins } from './ACardOrigins';
import type { useOriginOf } from '@ValenceClient/linking/useOriginOf';
import type { aLibrary } from '@ValenceClient/testing/aLibrary';
import type { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';

const mockLinked = '00000000-0000-4000-8000-000000000001';

jest.mock('@ValenceClient/library/fetchLibrary', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchLibrary'),
  fetchLibraries: () =>
    Promise.resolve([
      jest
        .requireActual<{ aLibrary: typeof aLibrary }>('@ValenceClient/testing/aLibrary')
        .aLibrary({ id: 'mine' }),
      jest
        .requireActual<{ aLibrary: typeof aLibrary }>('@ValenceClient/testing/aLibrary')
        .aLibrary({ id: 'theirs', linkedServerId: mockLinked }),
    ]),
}));

jest.mock('@ValenceClient/linking/fetchLinkedServerFaces', () => ({
  fetchLinkedServerFaces: () =>
    Promise.resolve([
      jest
        .requireActual<{
          aLinkedServerFace: typeof aLinkedServerFace;
        }>('@ValenceClient/testing/aLinkedServerFace')
        .aLinkedServerFace({ id: mockLinked, name: 'Films' }),
    ]),
}));

const seen: ReturnType<typeof useOriginOf>[] = [];

/**
 * Keeps each answer a card inside would be handed.
 *
 * @param name - What it says, so a test can draw it again with something new.
 */
const ACardReading = ({ name }: { name: string }) => {
  const originOf = useContext(CARD_ORIGINS);

  if (originOf !== null) {
    seen.push(originOf);
  }

  return <Text>{name}</Text>;
};

ACardReading.displayName = 'ACardReading';

beforeEach(() => {
  seen.length = 0;
});

describe('ACardOrigins', () => {
  it('tells every card inside where it comes from', async () => {
    await render(
      <ACardOrigins>
        <ACardReading name="Arrival" />
      </ACardOrigins>,
      { wrapper: CacheScope },
    );

    await waitFor(() => {
      expect(seen.at(-1)?.('theirs')?.label).toBe('From Films');
    });

    expect(seen.at(-1)?.('mine')).toBeNull();
  });

  it('hands the cards the same answer while the shelf around them is drawn again', async () => {
    const drawn = await render(
      <ACardOrigins>
        <ACardReading name="Arrival" />
      </ACardOrigins>,
      { wrapper: CacheScope },
    );

    await waitFor(() => {
      expect(seen.at(-1)?.('theirs')).not.toBeNull();
    });

    const settled = seen.at(-1);

    await drawn.rerender(
      <ACardOrigins>
        <ACardReading name="Dune" />
      </ACardOrigins>,
    );

    expect(drawn.getByText('Dune')).toBeTruthy();
    expect(seen.at(-1)).toBe(settled);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ACardOrigins.displayName).toBe('ACardOrigins');
  });
});
