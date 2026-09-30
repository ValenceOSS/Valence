import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { LogLevel } from '@ValenceContracts/schemas/Log';
import { say } from '@ValenceI18n/say';

/**
 * How a level looks wherever it is drawn — its words, the tone of a badge for it and the colour of a
 * bar for it — so the graph, the tags and the filters all agree on which colour is an error.
 *
 * @param level - How serious a record is.
 * @returns Its label, badge tone and colour.
 */
const describeLogLevel = (level: LogLevel): { label: string; tone: BadgeTone; colour: string } => {
  switch (level) {
    case 'debug':
      return {
        label: say('screens.admin.describeLogLevel.debug'),
        tone: 'quiet',
        colour: 'var(--color-text-muted)',
      };
    case 'info':
      return {
        label: say('screens.admin.describeLogLevel.info'),
        tone: 'accent',
        colour: 'var(--color-accent)',
      };
    case 'warn':
      return { label: say('common.warnings'), tone: 'warning', colour: 'var(--color-highlight)' };
    case 'error':
      return {
        label: say('screens.admin.describeLogLevel.errors'),
        tone: 'danger',
        colour: 'var(--color-danger)',
      };
  }
};

export { describeLogLevel };
