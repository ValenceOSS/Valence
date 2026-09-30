import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { PluginMark } from './PluginMark';

describe('PluginMark', () => {
  it('draws the plugin’s own icon where the catalogue has one', () => {
    const { container } = render(
      <PluginMark plugin={aCatalogueEntry({ iconUrl: 'https://example.test/icon.png' })} />,
    );

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.test/icon.png');
  });

  it('draws the logo of a service it talks to, where one is known', () => {
    const { container } = render(
      <PluginMark
        plugin={aCatalogueEntry({
          permissions: [{ kind: 'network', hosts: ['api.spotify.com'] }],
        })}
      />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('falls back to the first letter of its name', () => {
    const { container } = render(<PluginMark plugin={aCatalogueEntry()} size="lg" />);

    expect(container.textContent).toBe('A');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginMark.displayName).toBe('PluginMark');
  });
});
