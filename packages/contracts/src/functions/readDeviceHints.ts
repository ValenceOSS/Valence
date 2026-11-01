import { DeviceHintsSchema } from '@ValenceContracts/schemas/DeviceHints';
import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';

const LONGEST_HEADER = 2048;

/**
 * Reads what a client said about its device from the header it travels in, keeping what is
 * well-formed and dropping the rest, so that a client newer than this server, or one that says
 * nothing, is described from its user agent alone rather than refused.
 *
 * @param header - The header's value, where the client sent one.
 * @returns What the client said that can be believed.
 */
const readDeviceHints = (header: string | null | undefined): DeviceHints => {
  if (header === null || header === undefined || header.length > LONGEST_HEADER) {
    return {};
  }

  try {
    const read = DeviceHintsSchema.safeParse(JSON.parse(decodeURIComponent(header)));

    return read.success ? read.data : {};
  } catch {
    return {};
  }
};

export { readDeviceHints };
