import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocLink } from '@ValenceDocs/components/DocLink/DocLink';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

describe('DocLink', () => {
  it('routes an address on this site', async () => {
    await renderInDocsRouter(() => <DocLink href="/install/docker-compose">Compose</DocLink>);

    expect(await screen.findByRole('link', { name: 'Compose' })).toHaveAttribute(
      'href',
      '/install/docker-compose',
    );
  });

  it('opens an outside address in a new tab', async () => {
    await renderInDocsRouter(() => <DocLink href="https://example.com">Out</DocLink>);

    const link = await screen.findByRole('link', { name: 'Out' });

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps a heading anchor as a plain anchor', async () => {
    await renderInDocsRouter(() => <DocLink href="#why">Why</DocLink>);

    expect(await screen.findByRole('link', { name: 'Why' })).not.toHaveAttribute('target');
  });
});
