import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { ArrangementRow } from './ArrangementRow';

describe('ArrangementRow', () => {
  it('offers every order the web does', async () => {
    const drawn = await render(
      <ArrangementRow
        arrangement={{ order: 'added', isHidingWatched: false }}
        onArrange={jest.fn()}
        onFocus={jest.fn()}
      />,
    );

    for (const name of ['Recently added', 'Release date', 'Title', 'Rating', 'Size']) {
      expect(drawn.getByRole('button', { name })).toBeTruthy();
    }
  });

  it('is told the order pressed, keeping what is left out as it was', async () => {
    const onArrange = jest.fn();
    const drawn = await render(
      <ArrangementRow
        arrangement={{ order: 'added', isHidingWatched: true }}
        onArrange={onArrange}
        onFocus={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Rating' }));

    expect(onArrange).toHaveBeenCalledWith({ order: 'rating', isHidingWatched: true });
  });

  it('turns leaving out what has been watched on and off', async () => {
    const onArrange = jest.fn();
    const drawn = await render(
      <ArrangementRow
        arrangement={{ order: 'size', isHidingWatched: true }}
        onArrange={onArrange}
        onFocus={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Only what you have not watched' }));

    expect(onArrange).toHaveBeenCalledWith({ order: 'size', isHidingWatched: false });
  });

  it('says when the remote lands on it, so Up can go on to the bar', async () => {
    const onFocus = jest.fn();
    const drawn = await render(
      <ArrangementRow
        arrangement={{ order: 'added', isHidingWatched: false }}
        onArrange={jest.fn()}
        onFocus={onFocus}
      />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Title' }), 'focus');
    await fireEvent(drawn.getByRole('button', { name: 'Only what you have not watched' }), 'focus');

    expect(onFocus).toHaveBeenCalledTimes(2);
  });
});
