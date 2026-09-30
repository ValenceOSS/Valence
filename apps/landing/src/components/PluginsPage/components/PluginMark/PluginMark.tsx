import {
  IconBrandAppleFilled,
  IconBrandDeezer,
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconBrandLastfm,
  IconBrandNetflix,
  IconBrandSpotifyFilled,
  IconBrandTidal,
  IconBrandYoutubeFilled,
} from '@tabler/icons-react';
import { cn } from '@ValenceUI/cn';
import type { PluginMarkProps } from './PluginMark.types';

const BRANDS = [
  { site: 'spotify.com', glyph: IconBrandSpotifyFilled },
  { site: 'apple.com', glyph: IconBrandAppleFilled },
  { site: 'deezer.com', glyph: IconBrandDeezer },
  { site: 'tidal.com', glyph: IconBrandTidal },
  { site: 'last.fm', glyph: IconBrandLastfm },
  { site: 'youtube.com', glyph: IconBrandYoutubeFilled },
  { site: 'github.com', glyph: IconBrandGithubFilled },
  { site: 'discord.com', glyph: IconBrandDiscordFilled },
  { site: 'netflix.com', glyph: IconBrandNetflix },
] as const;

const TILE_SIZES = {
  md: 'size-11 rounded-xl text-base',
  lg: 'size-14 rounded-2xl text-xl',
} as const;

const GLYPH_SIZES = { md: 22, lg: 28 } as const;

/**
 * The mark a plugin is known by: its own icon where the catalogue carries one, otherwise the logo
 * of the service it talks to where that is a service everybody recognises, and otherwise the first
 * letter of its name, so no plugin is drawn as the same anonymous jigsaw piece as every other.
 *
 * @param plugin - The plugin's catalogue entry.
 * @param size - How large to draw it.
 */
const PluginMark = ({ plugin, size = 'md' }: PluginMarkProps) => {
  const hosts = plugin.permissions.flatMap((permission) =>
    permission.kind === 'network' ? permission.hosts : [],
  );
  const brand = BRANDS.find(({ site }) =>
    hosts.some((host) => host === site || host.endsWith(`.${site}`)),
  );
  const tile = cn(
    'flex shrink-0 items-center justify-center overflow-hidden border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text',
    TILE_SIZES[size],
  );

  if (plugin.iconUrl !== undefined) {
    return (
      <img
        src={plugin.iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(tile, 'object-cover')}
      />
    );
  }

  if (brand !== undefined) {
    const Glyph = brand.glyph;

    return (
      <span aria-hidden className={tile}>
        <Glyph size={GLYPH_SIZES[size]} />
      </span>
    );
  }

  return (
    <span aria-hidden className={cn(tile, 'font-semibold')}>
      {plugin.name.slice(0, 1).toUpperCase()}
    </span>
  );
};

PluginMark.displayName = 'PluginMark';

export { PluginMark };
