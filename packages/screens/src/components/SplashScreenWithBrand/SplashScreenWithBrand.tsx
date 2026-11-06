import { useQuery } from '@tanstack/react-query';
import { SplashScreen } from '@ValenceUI/SplashScreen';
import { BrandLogo } from '@ValenceScreens/components/BrandLogo/BrandLogo';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import type { SplashScreenWithBrandProps } from './SplashScreenWithBrand.types';
import { say } from '@ValenceI18n/say';

const MARK_SIZE = 56;

/**
 * The splash screen in the server's own brand: the name and logo an administrator gave it, as the
 * bar's mark shows them, or Valence's where it has none, read out as loading that name unless the
 * screen says what else it is waiting for.
 *
 * Until this device knows whose brand it is — the first time it opens, before the server answers —
 * the mark and name are held back rather than Valence's being shown and then swapped for the
 * server's own. Every time after, the brand last seen is there from the first frame.
 *
 * @param label - What is being waited for, where it is something more particular than the app.
 */
const SplashScreenWithBrand = ({ label, ...props }: SplashScreenWithBrandProps) => {
  const appearance = useQuery(appearanceQueries.appearance());
  const brand = appearance.data?.brand;
  const name = brand?.name ?? say('common.valence');

  if (appearance.isPending) {
    return (
      <SplashScreen
        {...props}
        name=""
        mark={<span aria-hidden className="block size-14" />}
        label={label ?? say('common.loading')}
      />
    );
  }

  return (
    <SplashScreen
      {...props}
      name={name}
      mark={<BrandLogo logo={brand?.logo ?? null} size={MARK_SIZE} label={name} />}
      label={label ?? say('common.loadingTitle', { title: name })}
    />
  );
};

SplashScreenWithBrand.displayName = 'SplashScreenWithBrand';

export { SplashScreenWithBrand };
