import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import { AScrim } from './AScrim';

jest.mock('@ValenceMobile/platform/drawsNatively', () => ({ drawsNatively: jest.fn(() => true) }));

describe('AScrim', () => {
  it('darkens what is beneath without being in the way of a press', async () => {
    const drawn = await render(<AScrim />);

    expect(drawn.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });
});

describe('AScrim on a phone that cannot blur behind a view', () => {
  it('lays the gradients rising from the foot and in from the leading edge', async () => {
    jest.mocked(drawsNatively).mockReturnValueOnce(false);

    const drawn = await render(<AScrim />);
    const gradients = theDrawnRoot()
      .queryAll((node) => typeof node.type === 'string')
      .map((node) => StyleSheet.flatten(node.props['style']).experimental_backgroundImage)
      .filter((gradient) => typeof gradient === 'string');

    expect(drawn.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
    expect(gradients).toEqual([
      expect.stringContaining('to top'),
      expect.stringContaining('to right'),
    ]);
  });
});
