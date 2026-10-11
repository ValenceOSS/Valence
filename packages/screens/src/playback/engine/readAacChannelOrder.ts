const SIX = 6;

const CENTRE = 2;

const RIGHT = 1;

const SAMPLE_RATE = 48_000;

const FRAMES = 8192;

const asked: { order: Promise<'wave' | 'aac' | null> | null } = { order: null };

/**
 * Asks this browser which order its AAC encoder reads six channels in, by encoding a tone in the
 * centre alone and decoding it again: back in the centre means the order WAVE and FFmpeg use, which
 * is what the decoders hand over; back on the right means AAC's own order, centre first, which the
 * channels must be put into before encoding, or the dialogue comes out of the right speaker. Any
 * other answer, or a browser that cannot say, is nothing — and the sound is then folded to stereo
 * rather than risked. Asked once and remembered for the page.
 *
 * @returns The order, or nothing where it could not be told.
 */
const readAacChannelOrder = (): Promise<'wave' | 'aac' | null> => {
  asked.order ??= (async () => {
    if (typeof AudioEncoder === 'undefined' || typeof AudioDecoder === 'undefined') {
      return null;
    }

    const encoded: EncodedAudioChunk[] = [];
    const described: { config: AudioDecoderConfig | null } = { config: null };
    const encoder = new AudioEncoder({
      output: (chunk, metadata) => {
        encoded.push(chunk);
        described.config ??= metadata?.decoderConfig ?? null;
      },
      error: () => undefined,
    });
    const planes = new Float32Array(FRAMES * SIX);

    for (let frame = 0; frame < FRAMES; frame += 1) {
      planes[CENTRE * FRAMES + frame] = 0.5 * Math.sin((2 * Math.PI * 1000 * frame) / SAMPLE_RATE);
    }

    encoder.configure({
      codec: 'mp4a.40.2',
      sampleRate: SAMPLE_RATE,
      numberOfChannels: SIX,
      bitrate: 384_000,
    });
    encoder.encode(
      new AudioData({
        format: 'f32-planar',
        sampleRate: SAMPLE_RATE,
        numberOfFrames: FRAMES,
        numberOfChannels: SIX,
        timestamp: 0,
        data: planes,
      }),
    );
    await encoder.flush();
    encoder.close();

    if (described.config === null) {
      return null;
    }

    const loudness = Array.from({ length: SIX }, () => 0);
    const decoder = new AudioDecoder({
      output: (data) => {
        for (let plane = 0; plane < Math.min(SIX, data.numberOfChannels); plane += 1) {
          const samples = new Float32Array(data.numberOfFrames);

          data.copyTo(samples, { planeIndex: plane, format: 'f32-planar' });
          loudness[plane] =
            (loudness[plane] ?? 0) + samples.reduce((sum, value) => sum + value * value, 0);
        }

        data.close();
      },
      error: () => undefined,
    });

    decoder.configure(described.config);

    for (const chunk of encoded) {
      decoder.decode(chunk);
    }

    await decoder.flush();
    decoder.close();

    const loudest = loudness.indexOf(Math.max(...loudness));

    return loudest === CENTRE ? 'wave' : loudest === RIGHT ? 'aac' : null;
  })().catch(() => null);

  return asked.order;
};

export { readAacChannelOrder };
