import { say } from '@ValenceI18n/say';

const PHASE_LABELS: Readonly<Record<string, string>> = {
  probing: say('screens.adminArea.scanProgressBar.probing'),
  previews: say('screens.adminArea.scanProgressBar.generatingPreviews'),
  trickplay: say('screens.adminArea.describeQueueKind.drawingScrubPreviews'),
  segments: say('screens.adminArea.scanProgressBar.findingIntros'),
  clearing: say('screens.adminArea.scanProgressBar.clearing'),
};

/**
 * Names the stage a scan has reached in words rather than the identifier the server reports,
 * falling back to that identifier for any stage added since, as an unfamiliar name is more use than
 * a blank.
 *
 * @param phase - The stage, as the server reports it.
 * @returns What to call it.
 */
const describeScanPhase = (phase: string): string => PHASE_LABELS[phase] ?? phase;

export { describeScanPhase };
