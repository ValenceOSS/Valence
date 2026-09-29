import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { PluginCard } from './PluginCard';

describe('PluginCard', () => {
  it('says what the plugin is, who made it, what it may do and where its source is', () => {
    render(
      <ul>
        <PluginCard plugin={aCatalogueEntry()} index={0} />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'AniList and MyAnimeList' })).toBeInTheDocument();
    expect(screen.getByText('By Valence, version 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Extension')).toBeInTheDocument();
    expect(screen.getByText('Talks to graphql.anilist.co and anilist.co')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the source/ })).toHaveAttribute(
      'href',
      'https://github.com/ValenceOSS/valence-plugins/tree/main/plugins/anilist',
    );
  });

  it('shows the plugin icon where it has one, and says so when it asks for nothing', () => {
    const { container } = render(
      <ul>
        <PluginCard
          plugin={aCatalogueEntry({
            permissions: [],
            kinds: ['theme'],
            iconUrl: 'https://valenceoss.github.io/valence-plugins/icons/nord.png',
          })}
          index={0}
        />
      </ul>,
    );

    expect(screen.getByText('Asks for no permissions.')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://valenceoss.github.io/valence-plugins/icons/nord.png',
    );
  });
});
