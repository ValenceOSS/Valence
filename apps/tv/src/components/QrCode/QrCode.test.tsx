import { render } from '@testing-library/react-native';
import { z } from 'zod';
import { QrCode } from '@ValenceTv/components/QrCode/QrCode';

const SquareSchema = z.object({ backgroundColor: z.string() });

type Drawn = Awaited<ReturnType<typeof render>>;

const squaresOf = (drawn: Drawn): boolean[][] =>
  drawn
    .getByLabelText('Sign in on your phone')
    .children.flatMap((row) =>
      typeof row === 'string'
        ? []
        : [
            row.children.flatMap((square) =>
              typeof square === 'string'
                ? []
                : [SquareSchema.parse(square.props.style).backgroundColor === '#000'],
            ),
          ],
    );

describe('QrCode', () => {
  it('says what it is for VoiceOver', async () => {
    const drawn = await render(
      <QrCode value="https://valence.example/link" size={300} label="Sign in on your phone" />,
    );

    expect(drawn.getByLabelText('Sign in on your phone')).toBeOnTheScreen();
  });

  it('is drawn square, at the size it is asked for', async () => {
    const drawn = await render(
      <QrCode value="https://valence.example/link" size={300} label="Sign in on your phone" />,
    );
    const squares = squaresOf(drawn);

    expect(drawn.getByLabelText('Sign in on your phone')).toHaveStyle({ width: 300, height: 300 });
    expect(squares.length).toBeGreaterThan(20);
    expect(squares.every((row) => row.length === squares.length)).toBe(true);
  });

  it('leaves a quiet light border around the code', async () => {
    const drawn = await render(
      <QrCode value="https://valence.example/link" size={300} label="Sign in on your phone" />,
    );
    const squares = squaresOf(drawn);

    expect(squares[0]?.every((isDark) => !isDark)).toBe(true);
    expect(squares.at(-1)?.every((isDark) => !isDark)).toBe(true);
    expect(squares.flat().some((isDark) => isDark)).toBe(true);
  });

  it('draws a different code for a different address', async () => {
    const one = squaresOf(
      await render(
        <QrCode value="https://valence.example/a" size={300} label="Sign in on your phone" />,
      ),
    );
    const other = squaresOf(
      await render(
        <QrCode value="https://valence.example/b" size={300} label="Sign in on your phone" />,
      ),
    );

    expect(one).not.toEqual(other);
  });
});
