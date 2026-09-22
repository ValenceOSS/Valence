import { requireOptionalNativeModule } from 'expo';

type TabBar = {
  hasLiquidGlass: () => boolean;
};

/**
 * Whether this phone draws liquid glass, which decides whether the tabs are the system's own bar.
 *
 * @returns Whether it does, and false in a build without the Swift that knows.
 */
const hasLiquidGlass = (): boolean =>
  requireOptionalNativeModule<TabBar>('ValenceTabBar')?.hasLiquidGlass() ?? false;

export { hasLiquidGlass };
