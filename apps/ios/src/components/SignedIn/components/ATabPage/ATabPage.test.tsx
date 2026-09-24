import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useIsOnTop } from '@ValencePhone/hooks/useIsOnTop';
import { ATabPage } from './ATabPage';

const SaysWhetherOnTop = () => <Text>{useIsOnTop() ? 'on top' : 'behind'}</Text>;

describe('ATabPage', () => {
  it('tells its page it is on top while its tab shows', async () => {
    const drawn = await render(
      <ATabPage isShowing>
        <SaysWhetherOnTop />
      </ATabPage>,
    );

    expect(drawn.getByText('on top')).toBeTruthy();
  });

  it('keeps its page while another tab shows, telling it it is behind', async () => {
    const drawn = await render(
      <ATabPage isShowing={false}>
        <SaysWhetherOnTop />
      </ATabPage>,
    );

    expect(drawn.getByText('behind', { includeHiddenElements: true })).toBeTruthy();
  });
});
