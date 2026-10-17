import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DownloadStateChoice } from './DownloadStateChoice';

describe('DownloadStateChoice', () => {
  it('shows every state, with how many downloads there are', () => {
    render(<DownloadStateChoice downloads={[]} value={null} onChange={vi.fn()} />);

    expect(screen.getByText('Every state (0)')).toBeInTheDocument();
  });
});
