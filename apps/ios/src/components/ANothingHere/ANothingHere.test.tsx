import { Film } from '@keyline-icons/react-native';
import { render } from '@testing-library/react-native';
import { ANothingHere } from './ANothingHere';

describe('ANothingHere', () => {
  it('says what is missing, and what would change it', async () => {
    const drawn = await render(
      <ANothingHere of={Film} title="No films yet" detail="Ask the server admin to scan it." />,
    );

    expect(drawn.getByText('No films yet')).toBeTruthy();
    expect(drawn.getByText('Ask the server admin to scan it.')).toBeTruthy();
  });

  it('says only what is missing where there is nothing more to say', async () => {
    const drawn = await render(<ANothingHere of={Film} title="Nothing new" />);

    expect(drawn.getByText('Nothing new')).toBeTruthy();
  });
});
