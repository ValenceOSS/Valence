import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import type { Scan } from './scanACode.types';

type CodeScanner = {
  scan: () => Promise<object>;
};

const ScanSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('read'), text: z.string() }),
  z.object({ kind: z.literal('closed') }),
  z.object({ kind: z.literal('refused') }),
  z.object({ kind: z.literal('unable') }),
]);

/**
 * Raises the phone's own scanner over the app and waits for a QR code, or for somebody to close it.
 *
 * @returns What the code said; that it was closed first; that the camera may not be used; or that
 *   this device, or this build, has no scanner — which is only ever the simulator.
 */
const scanACode = async (): Promise<Scan> => {
  const scanner = requireOptionalNativeModule<CodeScanner>('ValenceCodeScanner');

  if (scanner === null) {
    return { kind: 'unable' };
  }

  const read = ScanSchema.safeParse(await scanner.scan());

  return read.success ? read.data : { kind: 'unable' };
};

export { scanACode };
