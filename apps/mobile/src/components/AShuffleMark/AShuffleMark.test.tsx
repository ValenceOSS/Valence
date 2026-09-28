import { render, screen } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AShuffleMark } from './AShuffleMark';

const theIcons = () => theDrawnRoot().queryAll((node) => node.type === 'RNSVGSvgView');

const theDot = () => JSON.stringify(screen.toJSON()).match(/"width":4\b/g) ?? [];

describe('AShuffleMark', () => {
  it('draws the icon alone while shuffle is off', async () => {
    await render(<AShuffleMark mode="off" size={20} />);

    expect(theIcons()).toHaveLength(1);
    expect(theDot()).toHaveLength(0);
  });

  it('adds a dot beneath while shuffling', async () => {
    await render(<AShuffleMark mode="on" size={20} />);

    expect(theIcons()).toHaveLength(1);
    expect(theDot()).toHaveLength(1);
  });

  it('adds a sparkle as well while mixing songs in', async () => {
    await render(<AShuffleMark mode="smart" size={20} />);

    expect(theIcons()).toHaveLength(2);
    expect(theDot()).toHaveLength(1);
  });

  it('leaves room around the icon for the dot and the sparkle', async () => {
    await render(<AShuffleMark mode="off" size={20} />);

    expect(theDrawnRoot()).toHaveStyle({ height: 38, width: 38 });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AShuffleMark.displayName).toBe('AShuffleMark');
  });
});
