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
 * @param label - What is being waited for, where it is something more particular than the app.
 */
const SplashScreenWithBrand = ({ label, ...props }: SplashScreenWithBrandProps) => {
  const brand = useQuery(appearanceQueries.appearance()).data?.brand;
  const name = brand?.name ?? say('common.valence');

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
