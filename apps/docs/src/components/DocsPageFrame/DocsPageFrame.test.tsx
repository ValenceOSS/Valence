import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsPageFrame } from '@ValenceDocs/components/DocsPageFrame/DocsPageFrame';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

describe('DocsPageFrame', () => {
  it('sets the page beside the list of every page', async () => {
    await renderInDocsRouter(() => (
      <DocsPageFrame>
        <p>The page</p>
      </DocsPageFrame>
    ));

    expect(await screen.findByText('The page')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Documentation' })).toBeInTheDocument();
  });

  it('gives a wide page the whole card, with no list beside it', async () => {
    await renderInDocsRouter(() => (
      <DocsPageFrame isWide>
        <p>The API</p>
      </DocsPageFrame>
    ));

    expect(await screen.findByText('The API')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Documentation' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DocsPageFrame.displayName).toBe('DocsPageFrame');
  });
});
