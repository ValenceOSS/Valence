import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OnThisPage } from '@ValenceDocs/components/DocPageView/components/OnThisPage/OnThisPage';

describe('OnThisPage', () => {
  it('links each heading', () => {
    render(
      <OnThisPage
        headings={[
          { id: 'a', text: 'First', level: 2 },
          { id: 'b', text: 'Second', level: 3 },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'First' })).toHaveAttribute('href', '#a');
    expect(screen.getByRole('link', { name: 'Second' })).toHaveAttribute('href', '#b');
  });

  it('is not worth showing for a page with one section', () => {
    render(<OnThisPage headings={[{ id: 'a', text: 'Only', level: 2 }]} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
