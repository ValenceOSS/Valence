import { Download as DownloadIcon } from '@keyline-icons/react/fill';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { cn } from '@ValenceUI/cn';
import type { WallpaperCardProps } from './WallpaperCard.types';

const SAVE = cn(buttonStyles({ variant: 'soft', size: 'sm' }), 'gap-1.5 no-underline');

/**
 * One wallpaper on a solid tile: the desktop version with the phone version stood over its corner,
 * its name and what makes it its own, and a link to save each size.
 *
 * @param wallpaper - Its name, the files' name and a few words on its look.
 */
const WallpaperCard = ({ wallpaper }: WallpaperCardProps) => (
  <li className="flex flex-col gap-4 rounded-[1.15rem] bg-[var(--frame-card)] p-3 pb-4">
    <div className="relative">
      <img
        src={`/brand/previews/wallpaper-${wallpaper.id}-desktop.webp`}
        alt=""
        loading="lazy"
        width={960}
        height={540}
        className="aspect-video w-full rounded-xl object-cover"
      />
      <img
        src={`/brand/previews/wallpaper-${wallpaper.id}-phone.webp`}
        alt=""
        loading="lazy"
        width={540}
        height={960}
        className="absolute -bottom-2 right-3 aspect-[9/16] w-[22%] rounded-lg object-cover shadow-[var(--shadow-cast)] ring-1 ring-[var(--surface-line)]"
      />
    </div>
    <div className="flex flex-col gap-1 px-1 pt-1">
      <h3 className="text-base font-semibold tracking-[-0.01em] text-text">{wallpaper.name}</h3>
      <p className="text-sm text-text-muted">{wallpaper.look}</p>
    </div>
    <div className="flex flex-wrap gap-1.5 px-1">
      <Link
        href={`/brand/wallpapers/valence-${wallpaper.id}-desktop.jpg`}
        downloadAs={`Valence ${wallpaper.name} - Desktop 4K.jpg`}
        look="bare"
        className={SAVE}
      >
        <Icon of={DownloadIcon} size={14} />
        Desktop 4K
      </Link>
      <Link
        href={`/brand/wallpapers/valence-${wallpaper.id}-phone.jpg`}
        downloadAs={`Valence ${wallpaper.name} - Phone 4K.jpg`}
        look="bare"
        className={SAVE}
      >
        <Icon of={DownloadIcon} size={14} />
        Phone 4K
      </Link>
    </div>
  </li>
);

WallpaperCard.displayName = 'WallpaperCard';

export { WallpaperCard };
