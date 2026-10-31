import { PermissionStatus } from 'expo-notifications';
import type { NotificationPermissionsStatus } from 'expo-notifications';

const NOTIFICATIONS_ALLOWED: NotificationPermissionsStatus = {
  granted: true,
  status: PermissionStatus.GRANTED,
  canAskAgain: true,
  expires: 'never',
};

export { NOTIFICATIONS_ALLOWED };
