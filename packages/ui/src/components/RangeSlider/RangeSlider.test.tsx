import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RangeSlider } from './RangeSlider';

describe('RangeSlider', () => {
  it('names each handle, and says where they are as one moves', async () => {
    const onValuesChange = vi.fn();

    render(
      <RangeSlider
        label="WEB-DL 1080p"
        thumbLabels={['Smallest', 'Largest']}
        values={[10, 90]}
        max={100}
        onValuesChange={onValuesChange}
      />,
    );

    const [lower, upper] = screen.getAllByRole('slider');

    expect(lower).toHaveAccessibleName('Smallest');
    expect(upper).toHaveAccessibleName('Largest');
    expect(lower).toHaveAttribute('aria-valuenow', '10');

    upper?.focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(onValuesChange).toHaveBeenCalledWith([10, 89]);
  });

  it('can be turned off', () => {
    render(
      <RangeSlider
        label="Size"
        thumbLabels={['Smallest', 'Largest']}
        values={[0, 100]}
        max={100}
        onValuesChange={vi.fn()}
        isDisabled
      />,
    );

    expect(screen.getAllByRole('slider')[0]).toHaveAttribute('data-disabled');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RangeSlider.displayName).toBe('RangeSlider');
  });
});
