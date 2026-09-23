import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AMusicPage } from './AMusicPage';

describe('AMusicPage', () => {
  it('holds a page of the music library', async () => {
    const drawn = await render(
      <AMusicPage>
        <Text>Even In Arcadia</Text>
      </AMusicPage>,
    );

    expect(drawn.getByText('Even In Arcadia')).toBeTruthy();
  });
});
