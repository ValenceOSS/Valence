import { say } from '@ValenceI18n/say';

const RANGES: Readonly<Record<string, string>> = {
  DolbyVision: say('client.library.describeRange.dolbyVision'),
  HDR10Plus: 'HDR10+',
  HDR10: 'HDR10',
  HLG: 'HLG',
};

/**
 * Names a picture's dynamic range as it is sold, leaving the ordinary range unsaid.
 *
 * @param videoRange - The range as the file reports it.
 * @returns Its name, or null for standard range and anything unrecognised.
 */
const describeRange = (videoRange: string): string | null => RANGES[videoRange] ?? null;

export { describeRange };
