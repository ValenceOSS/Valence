import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CatalogueTiles } from './CatalogueTiles';

const COUNTS = {
  library: 4,
  downloading: 1,
  missing: 0,
  toApprove: 2,
  failed: 0,
  notFollowed: 3,
};

describe('CatalogueTiles', () => {
  it('shows every status something stands at, with its count, and everything', () => {
    render(<CatalogueTiles counts={COUNTS} total={10} value="all" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /Everything\s*10/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /To approve\s*2/ })).not.toBeChecked();
    expect(screen.queryByRole('radio', { name: /Failed/ })).not.toBeInTheDocument();
  });

  it('keeps the status chosen even once nothing stands at it', () => {
    render(<CatalogueTiles counts={COUNTS} total={10} value="failed" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /Failed\s*0/ })).toBeChecked();
  });

  it('says the status chosen', async () => {
    const onChange = vi.fn();

    render(<CatalogueTiles counts={COUNTS} total={10} value="all" onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('radio', { name: /Not followed/ }));

    expect(onChange).toHaveBeenCalledWith('notFollowed');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CatalogueTiles.displayName).toBe('CatalogueTiles');
  });
});
