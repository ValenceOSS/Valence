import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.reader.panel';

/**
 * Whether a reader's side panel stays open beside the page, as somebody last left it on this device.
 *
 * Pinned, the panel is part of the page and the page makes room for it; unpinned, it slides over
 * the page when asked for and goes away when the page is touched. Which is better depends on the
 * screen — a wide monitor has room to spare and a phone has none — so it is kept on the device.
 *
 * @returns Whether it is pinned.
 */
const readPanelPinned = (): boolean => platformInUse().store.read(STORAGE_KEY) === 'pinned';

/**
 * Remembers whether a reader's side panel stays open beside the page.
 *
 * @param isPinned - Whether it is pinned.
 */
const writePanelPinned = (isPinned: boolean): void => {
  platformInUse().store.write(STORAGE_KEY, isPinned ? 'pinned' : 'loose');
};

export { readPanelPinned, writePanelPinned };
