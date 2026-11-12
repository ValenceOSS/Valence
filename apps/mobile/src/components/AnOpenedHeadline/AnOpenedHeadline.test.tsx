import { render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AnOpenedHeadline } from './AnOpenedHeadline';

describe('AnOpenedHeadline', () => {
  it('lays the facts, the age rating, the quality and the status out together', async () => {
    const drawn = await render(
      <AnOpenedHeadline
        facts="2016 · 1h 56m"
        rating={{ certification: '15', region: 'GB' }}
        quality={['4K', 'HDR']}
        statuses={[{ label: 'Returning', tone: 'success' }]}
      />,
    );

    expect(drawn.getByText('2016 · 1h 56m')).toBeTruthy();
    expect(drawn.getByLabelText('Rated 15 by the BBFC')).toBeTruthy();
    expect(drawn.getByText('4K')).toBeTruthy();
    expect(drawn.getByText('HDR')).toBeTruthy();
    expect(drawn.getByText('Returning')).toBeTruthy();
  });

  it('leaves out what it was not given', async () => {
    const drawn = await render(
      <AnOpenedHeadline facts="" rating={null} quality={['4K']} statuses={[]} />,
    );

    expect(drawn.getByText('4K')).toBeTruthy();
    expect(drawn.queryByLabelText(/^Rated /)).toBeNull();
    expect(drawn.getAllByText(/./)).toHaveLength(1);
  });

  it('wraps onto another line rather than running off the side', async () => {
    await render(<AnOpenedHeadline facts="2016" rating={null} quality={[]} statuses={[]} />);

    expect(theDrawnRoot()).toHaveStyle({
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnOpenedHeadline.displayName).toBe('AnOpenedHeadline');
  });
});
