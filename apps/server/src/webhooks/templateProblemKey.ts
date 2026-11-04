import type { StringKey } from '@ValenceI18n/StringKey';
import type { TemplateProblem } from '@ValenceContracts/functions/renderWebhookTemplate';

/**
 * Names the string that says why a Custom webhook's template could not be filled, for a delivery's
 * error and for refusing a template that would never send.
 *
 * @param problem - What went wrong.
 * @returns The string's key.
 */
const templateProblemKey = (problem: TemplateProblem): StringKey =>
  problem.kind === 'formNotAnObject'
    ? 'error.webhook.aFormTemplateIsAnObjectOfFields'
    : 'error.webhook.theMessageTemplateIsNotValidJson';

export { templateProblemKey };
