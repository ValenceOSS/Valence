import Constants from 'expo-constants';

/**
 * What somebody named this television in its settings, "Living Room", where the system will say.
 *
 * @returns The name, or nothing where it has none.
 */
const theTvsOwnName = (): string | null => Constants.deviceName ?? null;

export { theTvsOwnName };
