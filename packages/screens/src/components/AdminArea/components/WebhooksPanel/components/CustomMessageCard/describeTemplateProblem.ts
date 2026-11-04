import type { TemplateProblem } from '@ValenceContracts/functions/renderWebhookTemplate';
import { say } from '@ValenceI18n/say';

/**
 * Says what is wrong with a Custom template, where the line and column are known.
 *
 * @param problem - What is wrong.
 * @returns What to show under the template.
 */
const describeTemplateProblem = (problem: TemplateProblem): string =>
  problem.kind === 'formNotAnObject'
    ? say('screens.adminArea.customMessageCard.aFormBodyHasToBe')
    : problem.line === null || problem.column === null
      ? say('screens.adminArea.customMessageCard.thisIsntValidJSON')
      : say('screens.adminArea.customMessageCard.thisIsntValidJsonLineColumn', {
          line: problem.line,
          column: problem.column,
        });

export { describeTemplateProblem };
