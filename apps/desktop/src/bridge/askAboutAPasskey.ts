import { invoke } from '@tauri-apps/api/core';
import type { InvokeArgs } from '@tauri-apps/api/core';
import type { z } from 'zod';
import { say } from '@ValenceI18n/say';

type Unanswered = { kind: 'failed'; reason: string };

/**
 * Asks the host something about a passkey, reading an answer that never came or makes no sense as a
 * failure with a reason a person can read.
 *
 * @param command - The host's command.
 * @param args - What goes with it.
 * @param schema - What the answer has to be.
 * @returns What came of it.
 */
const askAboutAPasskey = async <Reply>(
  command: string,
  args: InvokeArgs,
  schema: z.ZodType<Reply | Unanswered>,
): Promise<Reply | Unanswered> => {
  const unanswered: Unanswered = {
    kind: 'failed',
    reason: say('desktop.preload.preload.thisAppDidNotAnswerAbout'),
  };

  return schema.catch(unanswered).parse(await invoke(command, args).catch(() => unanswered));
};

export { askAboutAPasskey };
