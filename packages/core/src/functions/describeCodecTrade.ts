import type { ReencodeCodec } from '@ValenceContracts/schemas/Reencode';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const TRADES = {
  h264: 'core.describeCodecTrade.h264',
  hevc: 'core.describeCodecTrade.hevc',
  av1: 'core.describeCodecTrade.av1',
} as const satisfies Record<ReencodeCodec, StringKey>;

/**
 * What choosing a codec costs as well as what it buys.
 *
 * The codec matters more than the rung — HEVC or AV1 at matched quality is roughly half the size of
 * H.264 — and it is also the choice with a hidden bill. Re-encoding to AV1 can force a conversion
 * on every play on older clients, which is a worse outcome than the large file was. Saying so at
 * the point of choosing is the only place it helps; a household's own direct-play figures are the
 * evidence for whether the trade suits it.
 *
 * @param codec - The codec being weighed.
 * @returns One sentence about what choosing it would mean.
 */
const describeCodecTrade = (codec: ReencodeCodec): string => say(TRADES[codec]);

export { describeCodecTrade };
