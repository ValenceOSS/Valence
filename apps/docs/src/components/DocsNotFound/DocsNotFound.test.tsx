import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsNotFound } from '@ValenceDocs/components/DocsNotFound/DocsNotFound';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

describe('DocsNotFound', () => {
  it('says the page is not there and links home', async () => {
    await renderInDocsRouter(() => <DocsNotFound />);

    expect(await screen.findByText('That page is not here')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the documentation home/ })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
