import { render } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { theColours } from '@ValencePhone/theme/theColours';
import { Words } from './Words';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('dark');
});

describe('Words', () => {
  it('says what it was given', async () => {
    const drawn = await render(<Words>Who is watching?</Words>);

    expect(drawn.getByText('Who is watching?')).toBeTruthy();
  });

  it('writes plainly in the theme ink', async () => {
    const drawn = await render(<Words>Plain</Words>);

    expect(drawn.getByText('Plain').props.style).toContainEqual({ color: theColours.dark.text });
  });

  it('writes quietly where it is a detail', async () => {
    const drawn = await render(<Words tone="muted">Quiet</Words>);

    expect(drawn.getByText('Quiet').props.style).toContainEqual({
      color: theColours.dark.textMuted,
    });
  });

  it('writes in the colour of trouble where it is trouble', async () => {
    const drawn = await render(<Words tone="danger">Wrong</Words>);

    expect(drawn.getByText('Wrong').props.style).toContainEqual({ color: theColours.dark.danger });
  });

  it('cuts itself short where it was told how many lines it may have', async () => {
    const drawn = await render(<Words lines={1}>A very long title indeed</Words>);

    expect(drawn.getByText('A very long title indeed').props.numberOfLines).toBe(1);
  });
});
