import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JobRunMix } from './JobRunMix';

describe('JobRunMix', () => {
  it('says how many are running and how the finished ones ended', () => {
    render(<JobRunMix running={1} completed={3} failed={1} stopped={0} />);

    expect(screen.getByText('running now').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText('completed').previousElementSibling).toHaveTextContent('3');
    expect(screen.getByText('failed').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText('succeeded').nextElementSibling).toHaveTextContent('75%');
    expect(
      screen.getByRole('img', { name: '3 completed, 1 failed, 0 stopped' }),
    ).toBeInTheDocument();
  });

  it('marks failures red only when there are some', () => {
    const { rerender } = render(<JobRunMix running={0} completed={2} failed={0} stopped={0} />);

    expect(screen.getByText('failed').previousElementSibling).not.toHaveClass('text-danger');

    rerender(<JobRunMix running={0} completed={2} failed={2} stopped={0} />);

    expect(screen.getByText('failed').previousElementSibling).toHaveClass('text-danger');
  });

  it('leaves out the success rate while nothing has finished', () => {
    render(<JobRunMix running={2} completed={0} failed={0} stopped={0} />);

    expect(screen.queryByText('succeeded')).not.toBeInTheDocument();
  });
});
