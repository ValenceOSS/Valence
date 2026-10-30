import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { AnOverview } from './AnOverview';

const PASSAGE = 'A scheming raccoon fools a mismatched family of forest creatures.';

/**
 * Tells the passage how many lines it took, as laying it out on a phone would.
 *
 * @param drawn - What was drawn.
 * @param count - How many lines.
 */
const laidOutOn = async (drawn: Awaited<ReturnType<typeof render>>, count: number) => {
  await fireEvent(drawn.getByText(PASSAGE), 'textLayout', {
    nativeEvent: { lines: Array.from({ length: count }, () => ({})) },
  });
};

describe('AnOverview', () => {
  it('says the whole of a short passage, offering no more', async () => {
    const drawn = await render(<AnOverview>{PASSAGE}</AnOverview>);

    await laidOutOn(drawn, 2);

    expect(drawn.getByText(PASSAGE)).toBeTruthy();
    expect(drawn.queryByText('More')).toBeNull();
  });

  it('holds a long passage short, and opens it out when pressed', async () => {
    const drawn = await render(<AnOverview>{PASSAGE}</AnOverview>);

    await laidOutOn(drawn, 6);

    expect(drawn.getByText(PASSAGE)).toHaveProp('numberOfLines', 3);
    expect(drawn.getByText('More')).toBeTruthy();

    await userEvent.press(drawn.getByText('More'));

    expect(drawn.getByText(PASSAGE)).not.toHaveProp('numberOfLines', 3);
    expect(drawn.queryByText('More')).toBeNull();
  });
});
