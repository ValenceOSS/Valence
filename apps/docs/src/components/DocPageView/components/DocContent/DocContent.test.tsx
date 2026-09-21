import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DocContent } from '@ValenceDocs/components/DocPageView/components/DocContent/DocContent';

describe('DocContent', () => {
  it('renders the page and reports its headings', async () => {
    const onHeadings = vi.fn();
    const Page = () => <h2 id="why">Why</h2>;

    render(<DocContent Content={Page} onHeadings={onHeadings} />);

    expect(screen.getByRole('heading', { name: 'Why' })).toBeInTheDocument();
    await waitFor(() => {
      expect(onHeadings).toHaveBeenCalledWith([{ id: 'why', text: 'Why', level: 2 }]);
    });
  });
});
