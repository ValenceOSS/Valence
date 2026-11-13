import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { ALoginMark } from './ALoginMark';

describe('ALoginMark', () => {
  it('draws the mark on the way in', async () => {
    const drawn = await render(
      <QueryClientProvider client={new QueryClient()}>
        <ALoginMark high={80} isIntroducing={false} settlesAfter={0} />
      </QueryClientProvider>,
    );

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });
});
