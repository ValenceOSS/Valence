import { HardwareTestReportSchema } from '@ValenceContracts/schemas/HardwareTestReport';
import type { HardwareTestReport } from '@ValenceContracts/schemas/HardwareTestReport';

/**
 * Tries a hardware acceleration setting on a short real transcode, so an administrator can see it is
 * actually in use rather than reading the logs for it. Takes as long as the transcode does.
 *
 * @param accel - The backend to try, as the setting names it, or empty for the one Valence would pick.
 * @returns What the hardware did, or null where the test could not be run.
 */
const testHardware = async (accel: string): Promise<HardwareTestReport | null> => {
  const response = await fetch('/api/admin/hardware/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accel }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = HardwareTestReportSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export { testHardware };
