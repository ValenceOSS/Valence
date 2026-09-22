import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { Phone } from './Phone';

beforeEach(async () => {
  await AsyncStorage.clear();
  forgetPlatform();
});

describe('Phone', () => {
  it('asks where the server is, where this phone has not been told', async () => {
    const drawn = await render(<Phone />);

    await waitFor(() => {
      expect(drawn.getByText('Where is your Valence?')).toBeTruthy();
    });
  });

  it('goes straight to the faces where it has been told', async () => {
    await AsyncStorage.setItem('valence.server.address', 'http://192.168.1.36:8420');

    const drawn = await render(<Phone />);

    await waitFor(() => {
      expect(drawn.getByText('Who is watching?')).toBeTruthy();
    });
  });
});
