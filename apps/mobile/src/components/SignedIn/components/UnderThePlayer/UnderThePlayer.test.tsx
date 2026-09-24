import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { useIsOnTop } from '@ValenceMobile/hooks/useIsOnTop';
import { UnderThePlayer } from './UnderThePlayer';

const Page = () => <Text>{useIsOnTop() ? 'on top' : 'covered'}</Text>;

describe('UnderThePlayer', () => {
  it('leaves a page on top while nothing covers it', async () => {
    const drawn = await render(
      <UnderThePlayer isCovered={false}>
        <Page />
      </UnderThePlayer>,
    );

    expect(drawn.getByText('on top')).toBeTruthy();
  });

  it('says a page is covered while the player is over it', async () => {
    const drawn = await render(
      <UnderThePlayer isCovered>
        <Page />
      </UnderThePlayer>,
    );

    expect(drawn.getByText('covered')).toBeTruthy();
  });

  it('keeps a page covered that another page was already over', async () => {
    const drawn = await render(
      <IS_ON_TOP.Provider value={false}>
        <UnderThePlayer isCovered={false}>
          <Page />
        </UnderThePlayer>
      </IS_ON_TOP.Provider>,
    );

    expect(drawn.getByText('covered')).toBeTruthy();
  });
});
