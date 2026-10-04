import { render } from '@testing-library/react-native';
import { HowFar } from './HowFar';

describe('HowFar', () => {
  it('says how far, out of a hundred', async () => {
    const drawn = await render(<HowFar fraction={0.42} label="Download progress for Dune" />);

    expect(
      drawn.getByLabelText('Download progress for Dune').props.accessibilityValue,
    ).toMatchObject({
      now: 42,
    });
  });

  it('never says more than all of it', async () => {
    const drawn = await render(<HowFar fraction={1.3} label="Download progress for Dune" />);

    expect(
      drawn.getByLabelText('Download progress for Dune').props.accessibilityValue,
    ).toMatchObject({
      now: 100,
    });
  });
});
