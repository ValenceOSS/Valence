import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContentRatingField } from './ContentRatingField';

describe('ContentRatingField', () => {
  it('picks the server’s own country’s rating from those it knows, with the age each is for', async () => {
    const user = userEvent.setup();
    const onRatingsChange = vi.fn();

    render(
      <ContentRatingField
        ratings={{ GB: '12A', US: 'PG-13' }}
        region="GB"
        onRatingsChange={onRatingsChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'United Kingdom' }));
    await user.click(await screen.findByRole('menuitemradio', { name: /^15/u }));

    expect(onRatingsChange).toHaveBeenCalledWith({ GB: '15', US: 'PG-13' });
  });

  it('folds other countries away, takes one’s rating away once emptied, and adds a country', async () => {
    const user = userEvent.setup();
    const onRatingsChange = vi.fn();

    render(
      <ContentRatingField
        ratings={{ GB: '12A', US: 'PG-13' }}
        region="GB"
        onRatingsChange={onRatingsChange}
      />,
    );

    expect(screen.queryByLabelText('United States')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Other countries/u }));
    await user.clear(screen.getByLabelText('United States'));

    expect(onRatingsChange).toHaveBeenLastCalledWith({ GB: '12A' });

    await user.type(screen.getByLabelText('Country code'), 'fr');
    await user.click(screen.getByRole('button', { name: 'Add country' }));

    expect(screen.getByLabelText('France')).toBeInTheDocument();
  });

  it('takes a rating as written where it knows none for the country, saying its age', () => {
    render(<ContentRatingField ratings={{ DE: '16' }} region="DE" onRatingsChange={vi.fn()} />);

    expect(screen.getByLabelText('Germany')).toHaveValue('16');
    expect(screen.getByText('For 16 and over')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContentRatingField.displayName).toBe('ContentRatingField');
  });
});
