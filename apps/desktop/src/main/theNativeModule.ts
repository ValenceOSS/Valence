import { createRequire } from 'node:module';
import { join } from 'node:path';
import { app } from 'electron';
import { z } from 'zod';

type PasskeyAsk = {
  rpId: string;
  clientDataJson: string;
  allow: Buffer[];
  userVerification: string;
  timeoutMs: number;
};

type PasskeyMaking = {
  rpId: string;
  rpName: string;
  userId: Buffer;
  userName: string;
  userDisplayName: string;
  clientDataJson: string;
  algorithms: number[];
  exclude: Buffer[];
  attachment: string;
  residentKey: string;
  userVerification: string;
  attestation: string;
  timeoutMs: number;
};

type AskForAPasskey = (window: Buffer, ask: PasskeyAsk) => Promise<object>;

type MakeAPasskey = (window: Buffer, making: PasskeyMaking) => Promise<object>;

const NativeSchema = z.object({
  askForAPasskey: z.custom<AskForAPasskey>((value) => typeof value === 'function').optional(),
  makeAPasskey: z.custom<MakeAPasskey>((value) => typeof value === 'function').optional(),
});

type NativeModule = z.infer<typeof NativeSchema>;

let loaded: NativeModule | null = null;

/**
 * Where the native module is, in a build and out of one.
 *
 * A native module cannot be loaded from inside an archive, so a build unpacks it beside the archive
 * the rest of the application is in, and it is read from there. There is one per processor, since a
 * Windows build carries both the x64 and the ARM64 module, and this machine's is the one it loads.
 *
 * @param appPath - Where the application is.
 * @param arch - This machine's processor, as Node names it.
 * @returns The module's path.
 */
const whereTheNativeModuleIs = (appPath: string, arch: string): string =>
  join(appPath.replace(/app\.asar$/u, 'app.asar.unpacked'), 'dist-native', `valence-${arch}.node`);

/**
 * The part of this client written in Rust, which asks Windows for what Electron cannot: a passkey,
 * from Windows Hello and whatever passkey managers have joined it.
 *
 * Loaded the first time it is wanted rather than on the way up, so that a machine it was not built
 * for — a Mac or Linux, which need none of it — never goes looking. What it offers is checked on the way in,
 * and a function this operating system's build does not have is simply absent. A module that is not
 * there at all, as in a checkout nobody has built it in, offers nothing, and whoever asked says so.
 *
 * @returns What the module offers.
 */
const theNativeModule = (): NativeModule => {
  if (loaded === null) {
    try {
      loaded = NativeSchema.parse(
        createRequire(import.meta.url)(whereTheNativeModuleIs(app.getAppPath(), process.arch)),
      );
    } catch {
      loaded = {};
    }
  }

  return loaded;
};

export type { PasskeyAsk, PasskeyMaking };

export { theNativeModule, whereTheNativeModuleIs };
