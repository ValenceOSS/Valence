import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { PluginDetails } from './PluginDetails';

describe('PluginDetails', () => {
  it('keeps the full permissions and the source folded away until asked for', async () => {
    render(<PluginDetails plugin={aCatalogueEntry()} />);

    const toggle = screen.getByRole('button', { name: /Details/ });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText('Talks to graphql.anilist.co and anilist.co'),
    ).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: /Hide details/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Talks to graphql.anilist.co and anilist.co')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the source/ })).toHaveAttribute(
      'href',
      'https://github.com/ValenceOSS/valence-plugins/tree/main/plugins/anilist',
    );
  });

  it('says so when a plugin asks for nothing', async () => {
    render(<PluginDetails plugin={aCatalogueEntry({ permissions: [] })} />);

    await userEvent.click(screen.getByRole('button', { name: /Details/ }));

    expect(screen.getByText('Asks for no permissions.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginDetails.displayName).toBe('PluginDetails');
  });
});
