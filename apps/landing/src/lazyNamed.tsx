import { lazy } from 'react';
import type { ComponentType } from 'react';

type Preloadable = ComponentType & { preload: () => Promise<ComponentType> };

/**
 * Wraps a component whose module is fetched only when first wanted, read from the named export its
 * module gives it. `preload` fetches it ahead of time; once fetched, it draws at once rather than
 * suspending, so a page whose code came early renders whole on its first frame.
 *
 * @param load - Fetches the component's module.
 * @param name - The name the component is exported under.
 * @returns The component, which suspends only while its module is still on the way.
 */
const lazyNamed = <Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
): Preloadable => {
  let loaded: ComponentType | null = null;
  let loading: Promise<ComponentType> | null = null;

  const preload = (): Promise<ComponentType> => {
    if (loading === null) {
      const attempt = load().then((module) => {
        loaded = module[name];

        return module[name];
      });

      attempt.catch(() => {
        loading = null;
      });
      loading = attempt;
    }

    return loading;
  };

  const Waited = lazy(async () => ({ default: await preload() }));

  const Loaded = () => {
    const Component = loaded ?? Waited;

    return <Component />;
  };

  Loaded.displayName = name;

  return Object.assign(Loaded, { preload });
};

export type { Preloadable };

export { lazyNamed };
