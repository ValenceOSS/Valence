import { readFileSync } from 'node:fs';
import { catalogueCommand } from './catalogueCommand';
import { keygenCommand } from './keygenCommand';
import { packCommand } from './packCommand';
import { readOptions } from './readOptions';
import { signCommand } from './signCommand';
import { USAGE } from './USAGE';

type Output = { say: (line: string) => void; complain: (line: string) => void };

/**
 * Runs one `valence-plugin` command, saying what it did or why it could not.
 *
 * @param words - The arguments after `valence-plugin`.
 * @param environment - The environment, for the signing key.
 * @param output - Where to write what happened.
 * @param now - The time, for a catalogue's dates.
 * @returns The exit code: 0 on success, 1 on failure.
 */
const runCli = (
  words: readonly string[],
  environment: Readonly<Record<string, string | undefined>>,
  output: Output,
  now: Date = new Date(),
): number => {
  const [command, ...rest] = words;
  const { options, positional } = readOptions(rest);
  const signingKey = (): string => {
    const key = options['key'] === undefined ? environment['VALENCE_PLUGIN_SIGNING_KEY'] : readFileSync(options['key'], 'utf8');

    if (key === undefined || key.trim() === '') {
      throw new Error('No signing key: pass --key or set VALENCE_PLUGIN_SIGNING_KEY.');
    }

    return key;
  };

  try {
    if (command === 'pack') {
      output.say(`Packed ${packCommand(positional[0] ?? '.', options['out'] ?? 'dist')}`);

      return 0;
    }

    if (command === 'sign' && positional[0] !== undefined) {
      output.say(`Signed ${signCommand(positional[0], signingKey())}`);

      return 0;
    }

    if (command === 'keygen' && positional[0] !== undefined) {
      const paths = keygenCommand(options['out'] ?? 'keys', positional[0]);

      output.say(`Private key: ${paths.privateKey}`);
      output.say(`Public key: ${paths.publicKey}`);

      return 0;
    }

    const keyId = options['key-id'];
    const packageUrl = options['package-url'];
    const sourceUrl = options['source-url'];
    const iconUrl = options['icon-url'];

    if (
      command === 'catalogue' &&
      positional[0] !== undefined &&
      keyId !== undefined &&
      packageUrl !== undefined &&
      sourceUrl !== undefined &&
      iconUrl !== undefined
    ) {
      const catalogue = catalogueCommand({
        packagesDirectory: positional[0],
        outDirectory: options['out'] ?? 'site',
        keyId,
        privateKeyPem: signingKey(),
        packageUrl,
        sourceUrl,
        iconUrl,
        now,
      });

      output.say(`Catalogue of ${catalogue.plugins.length.toString()} plugins written`);

      return 0;
    }

    output.complain(USAGE);

    return 1;
  } catch (failure) {
    output.complain(failure instanceof Error ? failure.message : String(failure));

    return 1;
  }
};

export { runCli };
