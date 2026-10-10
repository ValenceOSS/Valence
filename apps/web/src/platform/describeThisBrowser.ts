import { z } from 'zod';
import { detectClientLabel } from '@ValenceClient/playback/detectClientLabel';

const ClientHintsSchema = z.object({
  userAgentData: z.object({ brands: z.array(z.object({ brand: z.string() })).max(20) }),
});

/**
 * What to call this client, asked of the browser: its user agent, and the brands its client hints
 * name where it has them, which are all that tell Chrome from the browsers built on it.
 *
 * Reading a user agent is the same wherever it is read, so that part belongs to the application; a
 * user agent to read is a thing only a browser has, so getting hold of one belongs here.
 *
 * @returns The device as a person would describe it.
 */
const describeThisBrowser = (): string => {
  const hints = ClientHintsSchema.safeParse(navigator);

  return detectClientLabel(
    navigator.userAgent,
    hints.success ? hints.data.userAgentData.brands.map((one) => one.brand) : [],
  );
};

export { describeThisBrowser };
