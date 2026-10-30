import { render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AMiniProgress } from './AMiniProgress';

const thePlayedPart = () => {
  const [played] = theDrawnRoot().children;

  if (played === undefined || typeof played === 'string') {
    throw new Error('Nothing was played.');
  }

  return played;
};

describe('AMiniProgress', () => {
  it('fills as far through as it has played', async () => {
    await render(<AMiniProgress positionSeconds={30} durationSeconds={120} />);

    expect(thePlayedPart()).toHaveStyle({ width: '25%' });
  });

  it('fills no further than the end, and not at all with no length known', async () => {
    const drawn = await render(<AMiniProgress positionSeconds={300} durationSeconds={120} />);

    expect(thePlayedPart()).toHaveStyle({ width: '100%' });

    await drawn.rerender(<AMiniProgress positionSeconds={30} durationSeconds={0} />);

    expect(thePlayedPart()).toHaveStyle({ width: '0%' });
  });

  it('is left out of what is read aloud', async () => {
    await render(<AMiniProgress positionSeconds={30} durationSeconds={120} />);

    expect(theDrawnRoot()).toHaveProp('accessibilityElementsHidden', true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AMiniProgress.displayName).toBe('AMiniProgress');
  });
});
