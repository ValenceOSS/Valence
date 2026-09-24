import { Alert } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { useConfirmHiding } from './useConfirmHiding';
import type { Hiding } from '@ValenceClient/library/useHidden';

const aHiding = (overrides: Partial<Hiding> = {}): Hiding => ({
  entries: [],
  isHidden: () => false,
  asking: null,
  ask: jest.fn(),
  askLibrary: jest.fn(),
  dismiss: jest.fn(),
  confirm: jest.fn(),
  show: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('useConfirmHiding', () => {
  it('asks nothing until something is to be hidden', async () => {
    const asking = jest.spyOn(Alert, 'alert');

    await renderHook(
      () => {
        useConfirmHiding(aHiding());
      },
      { wrapper: CacheScope },
    );

    expect(asking).not.toHaveBeenCalled();
  });

  it('asks first, and hides it only once somebody says so', async () => {
    const asking = jest.spyOn(Alert, 'alert');
    const hiding = aHiding({
      asking: { kind: 'item', subjectId: 'arrival', title: 'Arrival' },
    });
    const onHidden = jest.fn();

    await renderHook(
      () => {
        useConfirmHiding(hiding, onHidden);
      },
      { wrapper: CacheScope },
    );

    const buttons = asking.mock.calls[0]?.[2] ?? [];

    buttons.find((button) => button.text === 'Hide it')?.onPress?.();

    expect(hiding.confirm).toHaveBeenCalled();
    expect(onHidden).toHaveBeenCalled();
  });
});
