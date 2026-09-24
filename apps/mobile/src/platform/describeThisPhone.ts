import { deviceName, modelName } from 'expo-device';

/**
 * What to call this phone in the list of sessions somebody is reading.
 *
 * What its owner named it where the phone will say — "Dan's iPhone" is what they will recognise —
 * and the model where it will not. A simulator answers neither, and is named as what it is rather
 * than left blank.
 *
 * @returns The device as a person would describe it.
 */
const describeThisPhone = (): string => deviceName ?? modelName ?? 'iPhone';

export { describeThisPhone };
