import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocPageView } from '@ValenceDocs/components/DocPageView/DocPageView';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';

const page: DocPage = {
  path: '/start/example',
  section: 'start',
  sectionTitle: 'Getting started',
  title: 'Example page',
  description: 'About the example.',
  order: 1,
  load: () =>
    Promise.resolve({
      default: () => (
        <>
          <h2 id="one">One</h2>
          <h2 id="two">Two</h2>
        </>
      ),
    }),
};

describe('DocPageView', () => {
  it('shows the page and lists its sections', async () => {
    await renderInDocsRouter(() => <DocPageView page={page} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Example page' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: /One/ })).toBeInTheDocument();
    expect(await screen.findByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    expect(document.title).toBe('Example page | Valence Docs');
  });
});
