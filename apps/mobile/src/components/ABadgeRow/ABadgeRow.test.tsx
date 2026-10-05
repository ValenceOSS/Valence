import { render } from '@testing-library/react-native';
import { ABadgeRow } from './ABadgeRow';

describe('ABadgeRow', () => {
  it('draws a badge for each thing it is given', async () => {
    const drawn = await render(
      <ABadgeRow badges={[{ label: 'Drama', tone: 'solid' }, { label: 'Returning Series' }]} />,
    );

    expect(drawn.getByText('Drama')).toBeTruthy();
    expect(drawn.getByText('Returning Series')).toBeTruthy();
  });

  it('draws nothing where there is nothing to say', async () => {
    const drawn = await render(<ABadgeRow badges={[]} />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ABadgeRow.displayName).toBe('ABadgeRow');
  });
});
