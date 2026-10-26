import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';
import type { SourceTrouble } from '@ValenceServer/sources/SourceTrouble';

/**
 * Asks each metadata provider in turn and takes the first real answer, telling whoever is listening
 * that a provider failed only where none answered — so one plugin failing does not stop a catalogue's
 * good answer from being kept.
 *
 * @param providers - The providers to ask, in order of preference.
 * @param ask - Asks one, or answers undefined where it cannot be asked this.
 * @param onProblem - Told when a provider fails, so the work can carry on without it.
 * @returns The first answer, or null where nobody had one.
 */
const firstAnswerOf = async <Provider extends { name: string }, Found>(
  providers: readonly Provider[],
  ask: (provider: Provider) => Promise<Found | null> | undefined,
  onProblem?: (provider: string, reason: Said) => void,
): Promise<Found | null> => {
  let trouble: SourceTrouble | null = null;

  for (const provider of providers) {
    const { value: found, trouble: heard } = await troubleWatch.contain(async () => {
      try {
        return (await ask(provider)) ?? null;
      } catch (error) {
        troubleWatch.report({ source: provider.name, reason: 'faulty' });
        onProblem?.(
          provider.name,
          error instanceof Error
            ? sayVerbatim(describeFailure(error))
            : saying('server.library.metadataProvider.providerFailed'),
        );

        return null;
      }
    });

    if (found !== null) {
      return found;
    }

    trouble ??= heard;
  }

  if (trouble !== null) {
    troubleWatch.report(trouble);
  }

  return null;
};

export { firstAnswerOf };
