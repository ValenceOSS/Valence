import { requireOptionalNativeModule } from 'expo';
import { hasLiquidGlass } from './hasLiquidGlass';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));

describe('hasLiquidGlass', () => {
  it('says there is none where the tab bar module is missing', () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue(null);

    expect(hasLiquidGlass()).toBe(false);
  });

  it('asks the tab bar module where there is one', () => {
    jest.mocked(requireOptionalNativeModule).mockReturnValue({ hasLiquidGlass: () => true });

    expect(hasLiquidGlass()).toBe(true);
  });
});
