import { render } from '@testing-library/react-native';
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
    const tree = JSON.stringify(drawn.toJSON());

    expect(drawn.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
    expect(tree).toContain('linear-gradient(to top');
    expect(tree).toContain('linear-gradient(to right');
  });
});
