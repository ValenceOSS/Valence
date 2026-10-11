const registered: { done: Promise<void> | null } = { done: null };

/**
 * Teaches Mediabunny the codecs browsers do not have: the AC-3, E-AC-3 and DTS decoders, which
 * decode the sound of films the media element cannot play, and the FLAC encoder, which hands that
 * sound back to the element without losing a sample or a channel. Loaded once, when first needed,
 * so a page that never plays such a film never downloads them.
 *
 * @returns When they are ready.
 */
const registerCodecExtensions = (): Promise<void> => {
  registered.done ??= Promise.all([
    import('@mediabunny/ac3'),
    import('@mediabunny/dts'),
    import('@mediabunny/flac-encoder'),
  ]).then(([ac3, dts, flac]) => {
    ac3.registerAc3Decoder();
    dts.registerDtsDecoder();
    flac.registerFlacEncoder();
  });

  return registered.done;
};

export { registerCodecExtensions };
