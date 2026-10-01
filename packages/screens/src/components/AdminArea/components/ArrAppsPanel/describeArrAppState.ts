import { sayAgain } from '@ValenceI18n/sayAgain';
import { docsFor } from '@ValenceCore/functions/docsFor';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { say } from '@ValenceI18n/say';

/**
 * Says how a connected app is, as a badge and the line beneath it: switched off, never checked,
 * answering and at which version, or not answering and why, with where the fix is.
 *
 * @param app - The app.
 * @returns The badge's words and tone, and the detail where there is one.
 */
const describeArrAppState = (app: ArrApp): StateBadge => {
  if (!app.isEnabled) {
    return { label: say('common.off'), tone: 'quiet', detail: null };
  }

  if (app.isWorking === null) {
    return { label: say('common.notChecked'), tone: 'quiet', detail: null };
  }

  return app.isWorking
    ? {
        label: say('common.working'),
        tone: 'success',
        detail:
          app.version === null
            ? null
            : say('screens.arrAppsPanel.describeArrAppState.versionVersion', {
                version: app.version,
              }),
      }
    : {
        label: say('screens.adminArea.requestsPanel.unreachable'),
        tone: 'danger',
        detail: app.lastProblem === null ? null : sayAgain(app.lastProblem),
        help: docsFor(app.lastProblemCode),
      };
};

export { describeArrAppState };
