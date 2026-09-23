import { Text } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { Television } from '@ValenceTv/Television';

const mockTheWayIn = () => {
  const client = useQueryClient();

  return <Text>{`Stale after ${String(client.getDefaultOptions().queries?.staleTime)}`}</Text>;
};

jest.mock('@ValenceTv/screens/TheWayIn/TheWayIn', () => ({ TheWayIn: () => mockTheWayIn() }));

jest.mock('@ValenceClient/session/auth', () => ({ fetchSession: () => Promise.resolve(null) }));

describe('Television', () => {
  it('opens on the way in, inside the cache the web builds', async () => {
    const drawn = await render(<Television />);

    expect(drawn.getByText('Stale after 60000')).toBeTruthy();
  });
});
