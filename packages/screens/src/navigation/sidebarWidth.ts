import { rememberedWidth } from '@ValenceScreens/layout/rememberedWidth';

const sidebarWidth = rememberedWidth('valence.sidebarWidth', {
  narrowest: 200,
  widest: 360,
  usual: 240,
});

export { sidebarWidth };
