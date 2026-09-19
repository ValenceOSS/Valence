import type { CardigannSetting } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';

const SECRET_NAMES = /pass|key|cookie|token|secret|pin|2fa|otp|pid|captcha/i;

/**
 * Whether a definition's setting holds something that is never shown back once saved — a password,
 * a key, a cookie — which is every password field, and any field whose name says it is one.
 *
 * @param setting - The setting.
 * @returns Whether it is secret.
 */
const isSecretSetting = (setting: Pick<CardigannSetting, 'name' | 'type'>): boolean =>
  setting.type === 'password' || (setting.type === 'text' && SECRET_NAMES.test(setting.name));

export { isSecretSetting };
