import { render } from '@testing-library/react-native';
import { useContext } from 'react';
import { Text } from 'react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { CARD_ORIGINS } from '@ValenceMobile/components/ACardOrigins/CARD_ORIGINS';
import { AnOriginHere } from './AnOriginHere';

/**
 * Says whether it was told where cards come from.
 */
const ACardReading = () => <Text>{useContext(CARD_ORIGINS) === null ? 'untold' : 'told'}</Text>;

ACardReading.displayName = 'ACardReading';

describe('AnOriginHere', () => {
  it('tells the card inside it where it comes from', async () => {
    const drawn = await render(
      <AnOriginHere>
        <ACardReading />
      </AnOriginHere>,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('told')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnOriginHere.displayName).toBe('AnOriginHere');
  });
});
