import { z } from 'zod';

type ArmNavigatorLike = {
  userAgent: string;
  userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<object> } | undefined;
};

const HintsSchema = z.object({ architecture: z.string().optional() });

/**
 * Works out whether a visitor's computer has an ARM processor, so a Windows on Arm PC or an ARM64
 * Linux machine is offered its own build first. The user agent cannot say on Windows, where every
 * browser calls itself x64, so the browser is asked for its architecture where it will answer, and
 * the user agent read only where it will not.
 *
 * @param from - The browser's navigator, or anything shaped like it.
 * @returns Whether it is ARM, false where nothing says.
 */
const detectArm = async (from: ArmNavigatorLike): Promise<boolean> => {
  const ask = from.userAgentData?.getHighEntropyValues;

  if (ask !== undefined) {
    try {
      const hints = HintsSchema.safeParse(await ask.call(from.userAgentData, ['architecture']));

      if (hints.success && hints.data.architecture !== undefined) {
        return hints.data.architecture === 'arm';
      }
    } catch {
      return false;
    }
  }

  return /aarch64|arm64/u.test(from.userAgent.toLowerCase());
};

export { detectArm };
