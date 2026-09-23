import { render } from '@testing-library/react-native';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';

type Drawn = Awaited<ReturnType<typeof render>>;

const partsOf = (drawn: Drawn) =>
  drawn.root?.children.flatMap((part) => (typeof part === 'string' ? [] : [part])) ?? [];

describe('ProgressLine', () => {
  it('fills as much of the line as has been watched', async () => {
    const drawn = await render(<ProgressLine fraction={0.25} />);
    const [watched, left] = partsOf(drawn);

    expect(watched).toHaveStyle({ flex: 0.25 });
    expect(left).toHaveStyle({ flex: 0.75 });
  });

  it('sits along the foot of a picture', async () => {
    const drawn = await render(<ProgressLine fraction={0.5} />);

    expect(drawn.root).toHaveStyle({ position: 'absolute' });
  });

  it('sits in a line of words when it is inline', async () => {
    const drawn = await render(<ProgressLine fraction={0.5} isInline />);

    expect(drawn.root).toHaveStyle({ position: 'relative', width: 140 });
  });

  it('is read out as how much has been watched', async () => {
    const drawn = await render(<ProgressLine fraction={0.426} />);

    expect(drawn.getByRole('progressbar', { name: 'Watched' })).toHaveAccessibilityValue({
      min: 0,
      max: 100,
      now: 43,
    });
  });
});
