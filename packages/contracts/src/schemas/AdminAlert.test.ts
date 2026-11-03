import { describe, expect, it } from 'vitest';
import { ADMIN_ALERTS, AdminAlertSchema, HiddenAlertsSchema } from './AdminAlert';

describe('AdminAlert', () => {
  it('knows every alert the overview can show', () => {
    for (const alert of ADMIN_ALERTS) {
      expect(AdminAlertSchema.safeParse(alert).success).toBe(true);
    }
  });

  it('refuses an alert it does not know', () => {
    expect(HiddenAlertsSchema.safeParse(['memory', 'toaster']).success).toBe(false);
  });

  it('refuses a list longer than there are alerts', () => {
    expect(
      HiddenAlertsSchema.safeParse(Array(ADMIN_ALERTS.length + 1).fill('memory')).success,
    ).toBe(false);
  });
});
