import { render, userEvent } from '@testing-library/react-native';
import { CastRow } from '@ValenceTv/components/CastRow/CastRow';

const CAST = [
  { personId: 101, name: 'Amy Adams', role: 'Louise', imageUrl: null },
  { personId: null, name: 'Somebody Unmatched', role: 'Soldier', imageUrl: null },
  { personId: 102, name: 'Jeremy Renner', role: 'Ian', imageUrl: 'https://image.example/jr.jpg' },
];

describe('CastRow', () => {
  it('offers only the people who can be opened, each with the part they played', async () => {
    const drawn = await render(<CastRow cast={CAST} onOpen={jest.fn()} />);

    expect(drawn.getByText('Cast')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Amy Adams, Louise' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Jeremy Renner, Ian' })).toBeTruthy();
    expect(drawn.queryByText('Somebody Unmatched')).toBeNull();
  });

  it('opens the page of whoever is chosen', async () => {
    const onOpen = jest.fn();
    const drawn = await render(<CastRow cast={CAST} onOpen={onOpen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Jeremy Renner, Ian' }));

    expect(onOpen).toHaveBeenCalledWith(102);
  });

  it('draws nothing where nobody can be opened', async () => {
    const drawn = await render(
      <CastRow
        cast={[{ personId: null, name: 'Nobody', role: 'Extra', imageUrl: null }]}
        onOpen={jest.fn()}
      />,
    );

    expect(drawn.queryByText('Cast')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CastRow.displayName).toBe('CastRow');
  });
});
