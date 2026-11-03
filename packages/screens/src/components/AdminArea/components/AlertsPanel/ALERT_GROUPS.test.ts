import { describe, expect, it } from 'vitest';
import { ADMIN_ALERTS } from '@ValenceContracts/schemas/AdminAlert';
import { ALERT_GROUPS } from './ALERT_GROUPS';

describe('ALERT_GROUPS', () => {
  it('offers a switch for every alert, each once', () => {
    const offered = ALERT_GROUPS.flatMap((group) => group.alerts.map((alert) => alert.id));

    expect([...offered].sort()).toEqual([...ADMIN_ALERTS].sort());
  });

  it('names and explains every alert', () => {
    for (const alert of ALERT_GROUPS.flatMap((group) => group.alerts)) {
      expect(alert.title).not.toBe('');
      expect(alert.description).not.toBe('');
    }
  });
});
