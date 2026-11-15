const ENCODERS: Readonly<Record<string, string>> = { eac3: 'eac3' };

const DEFAULT_ENCODER = 'aac';

/**
 * The FFmpeg encoder a planned audio encode runs, which is AAC for every codec but Dolby Digital
 * Plus. A client names the codec it wants, and what it names is not handed to FFmpeg unchecked.
 *
 * @param codec - The codec the plan encodes to.
 * @returns The encoder's name.
 */
const audioEncoderOf = (codec: string): string => ENCODERS[codec] ?? DEFAULT_ENCODER;

export { audioEncoderOf };
