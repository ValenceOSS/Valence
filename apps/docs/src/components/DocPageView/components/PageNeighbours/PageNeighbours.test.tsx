import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageNeighbours } from '@ValenceDocs/components/DocPageView/components/PageNeighbours/PageNeighbours';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

const item = (path: string, title: string) => ({ path, title, order: 1 });

describe('PageNeighbours', () => {
  it('links the page before and the page after', async () => {
    await renderInDocsRouter(() => (
      <PageNeighbours previous={item('/a', 'Before')} next={item('/b', 'After')} />
    ));

    expect(await screen.findByRole('link', { name: /Before/ })).toHaveAttribute('href', '/a');
    expect(screen.getByRole('link', { name: /After/ })).toHaveAttribute('href', '/b');
  });

  it('has only one link at the ends', async () => {
    await renderInDocsRouter(() => <PageNeighbours previous={null} next={item('/b', 'After')} />);

    expect(await screen.findAllByRole('link')).toHaveLength(1);
  });
});
