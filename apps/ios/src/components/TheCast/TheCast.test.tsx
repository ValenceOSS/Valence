import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { TheCast } from './TheCast';

describe('TheCast', () => {
  it('names each person and what they played, and opens someone known', async () => {
    installPlatform(aFakePlatform());
    const onLookAtPerson = jest.fn();
    const drawn = await render(
      <TheCast
        cast={[{ personId: 7, name: 'Amy Adams', role: 'Louise Banks', imageUrl: null }]}
        onLookAtPerson={onLookAtPerson}
      />,
    );

    expect(drawn.getByText('Louise Banks')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Amy Adams' }));

    expect(onLookAtPerson).toHaveBeenCalledWith(7);
  });
});
