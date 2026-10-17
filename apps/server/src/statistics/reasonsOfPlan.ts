import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

/**
 * Collects why a play could not be sent as the file lies: each part of the plan the server had to
 * change, by its reason, leaving out the parts the device could take as they are.
 *
 * @param plan - The plan agreed with the device.
 * @returns The reasons, each once.
 */
const reasonsOfPlan = (plan: PlaybackPlan): string[] => [
  ...new Set(
    [plan.container.reason, plan.video.reason, plan.audio.reason, plan.subtitles.reason]
      .map((reason) => reason.code)
      .filter((code) => code !== 'ClientSupportsSource'),
  ),
];

export { reasonsOfPlan };
