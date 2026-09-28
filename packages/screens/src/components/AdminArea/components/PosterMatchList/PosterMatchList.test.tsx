import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PosterMatchList } from './PosterMatchList';

const BOOK = {
  id: 'ol:1',
  title: 'Red Rising',
  year: 2014,
  detail: 'Pierce Brown',
  posterUrl: 'https://covers.example/red-rising.jpg',
};

describe('PosterMatchList', () => {
  it('offers each match with its year and says which was chosen', async () => {
    const onChoose = vi.fn();

    render(
      <PosterMatchList
        matches={[BOOK, { ...BOOK, id: 'ol:2', year: null, posterUrl: null }]}
        onChoose={onChoose}
      />,
    );

    expect(screen.getByText('Red Rising (2014)')).toBeInTheDocument();
    expect(screen.getAllByText('Pierce Brown')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: /Red Rising \(2014\)/ }));

    expect(onChoose).toHaveBeenCalledWith('ol:1');
  });

  it('draws a cover only for a match that has one', () => {
    const { container } = render(
      <PosterMatchList
        matches={[BOOK, { ...BOOK, id: 'ol:2', posterUrl: null }]}
        onChoose={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('shows the one being acted on as busy', () => {
    render(<PosterMatchList matches={[BOOK]} busyId="ol:1" onChoose={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Red Rising/ })).toBeDisabled();
  });
});
