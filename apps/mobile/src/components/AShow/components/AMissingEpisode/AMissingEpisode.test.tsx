import { render } from '@testing-library/react-native';
import { AMissingEpisode } from './AMissingEpisode';

describe('AMissingEpisode', () => {
  it('says which episode the library is missing, and when it aired', async () => {
    const drawn = await render(
      <AMissingEpisode at={4} title="The You You Are" stillUrl={null} airs="Airs Friday" />,
    );

    expect(drawn.getByText(/The You You Are/u)).toBeTruthy();
    expect(drawn.getByText('Not in this library · Airs Friday')).toBeTruthy();
  });
});
