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

  it('draws its handles the way the main slider does, in white rather than blue', () => {
    render(
      <RangeSlider
        label="WEB-DL 1080p"
        thumbLabels={['Smallest', 'Largest']}
        values={[10, 90]}
        max={100}
        onValuesChange={vi.fn()}
      />,
    );

    const [lower] = screen.getAllByRole('slider');

    expect(lower).toHaveClass('bg-text', 'rounded-full');
    expect(lower?.className).not.toContain('bg-primary');
  });

  it('says both times above the handles while the pointer is over it', async () => {
    const user = userEvent.setup();

    render(
      <RangeSlider
        label="Clip"
        thumbLabels={['Starts', 'Ends']}
        values={[10, 90]}
        max={100}
        valueLabel={(value) => `at ${value.toString()}s`}
        onValuesChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('at 10s')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('slider', { name: 'Starts' }));

    expect((await screen.findAllByText('at 10s')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('at 90s')).length).toBeGreaterThan(0);
  });

  it('says nothing above the handles where it was given no way to say a time', async () => {
    const user = userEvent.setup();

    render(
      <RangeSlider
        label="Clip"
        thumbLabels={['Starts', 'Ends']}
        values={[10, 90]}
        max={100}
        onValuesChange={vi.fn()}
      />,
    );

    await user.hover(screen.getByRole('slider', { name: 'Starts' }));

    expect(screen.queryByText('at 10s')).not.toBeInTheDocument();
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
