import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';

/**
 * Puts what a client says about its device into the one header it travels in, escaped so that a name
 * such as "Dan’s iPhone" survives a header's narrow alphabet.
 *
 * @param hints - What the client knows about its device.
 * @returns The header's value.
 */
const writeDeviceHints = (hints: DeviceHints): string => encodeURIComponent(JSON.stringify(hints));

export { writeDeviceHints };
