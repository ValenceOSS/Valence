import light from '@ValenceDiscordArt/valence-desktop.png';
import dark from '@ValenceDiscordArt/valence-desktop-dark.png';
import devLight from '@ValenceDiscordArt/valence-desktop-dev.png';
import devDark from '@ValenceDiscordArt/valence-desktop-dev-dark.png';

const DISCORD_PICTURES: Readonly<Record<string, string>> = {
  'valence-desktop': light,
  'valence-desktop-dark': dark,
  'valence-desktop-dev': devLight,
  'valence-desktop-dev-dark': devDark,
};

export { DISCORD_PICTURES };
