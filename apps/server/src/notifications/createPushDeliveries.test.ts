import { describe, expect, it } from 'vitest';
import { createPushDeliveries } from './createPushDeliveries';

const DELIVERY = {
  event: 'requests.available' as const,
  title: { code: 'common.ready', message: 'Ready', values: {} },
  body: { code: 'common.ready', message: 'Minecraft is ready', values: {} },
  link: null,
};

describe('createPushDeliveries', () => {
  it('reads a delivery back to whoever it was meant for, and nobody else', () => {
    const deliveries = createPushDeliveries();

    deliveries.keep('d', { userId: 'sam', profileId: 'sam-profile' }, DELIVERY);

    expect(deliveries.read('d', { userId: 'sam', profileId: 'sam-profile' })).toEqual(DELIVERY);
    expect(deliveries.read('d', { userId: 'sam', profileId: 'child' })).toBeNull();
    expect(deliveries.read('d', { userId: 'marques', profileId: null })).toBeNull();
  });

  it('reads one meant for a whole account to any of its profiles', () => {
    const deliveries = createPushDeliveries();

    deliveries.keep('d', { userId: 'sam', profileId: null }, DELIVERY);

    expect(deliveries.read('d', { userId: 'sam', profileId: 'child' })).toEqual(DELIVERY);
  });

  it('forgets a delivery after an hour', () => {
    let now = 0;
    const deliveries = createPushDeliveries(() => now);

    deliveries.keep('d', { userId: 'sam', profileId: null }, DELIVERY);
    now = 60 * 60 * 1000;

    expect(deliveries.read('d', { userId: 'sam', profileId: null })).toBeNull();
  });
});
