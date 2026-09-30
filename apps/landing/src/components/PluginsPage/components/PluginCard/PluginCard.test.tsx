import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { PluginCard } from './PluginCard';

describe('PluginCard', () => {
  it('says what the plugin is, who made it, which version, and in short what it may reach', () => {
    render(
      <ul>
        <PluginCard
          plugin={aCatalogueEntry({
            permissions: [
              { kind: 'network', hosts: ['graphql.anilist.co'] },
              { kind: 'library', access: 'read' },
            ],
          })}
          index={0}
        />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'AniList and MyAnimeList' })).toBeInTheDocument();
    expect(screen.getByText('Valence · v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Extension')).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'What AniList and MyAnimeList may reach' }),
    ).toHaveTextContent('Your library');
    expect(screen.getByText('Install from Admin › Plugins')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Details/ })).toBeInTheDocument();
  });

  it('says so when a plugin asks for nothing, and names a theme a theme', () => {
    render(
      <ul>
        <PluginCard plugin={aCatalogueEntry({ permissions: [], kinds: ['theme'] })} index={0} />
      </ul>,
    );

    expect(screen.getByText('Touches none of your things.')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginCard.displayName).toBe('PluginCard');
  });
});
