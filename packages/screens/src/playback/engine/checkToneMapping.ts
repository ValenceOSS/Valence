import type { ToneMappingCheck } from '@ValenceClient/playback/ToneMappingCheck';
import { PICTURE_SHADER } from './PICTURE_SHADER';
import { TONE_MAPPING_PROBES } from './TONE_MAPPING_PROBES';
import { bytesOf } from './hevc/bytesOf';
import { prepareHdrDecoding } from './prepareHdrDecoding';

const TOLERANCE = 8;

const ENCODED_GREY = 128;

type Probe = (typeof TONE_MAPPING_PROBES)[number];

const ROW_ALIGNMENT = 256;

/**
 * Decodes a probe's one frame the way an HDR film of its codec is decoded for tone mapping.
 *
 * @param probe - The probe.
 * @returns The frame, or why there is none: this browser will not take the decoder's settings, or
 *   took them and gave no frame back.
 */
const decodeProbe = async (probe: Probe): Promise<VideoFrame | 'notDecodable' | 'notDecoded'> => {
  const frameBytes = bytesOf(probe.frame);
  const prepared = prepareHdrDecoding({
    codec: probe.codec,
    config: {
      codec: probe.config,
      codedWidth: probe.size,
      codedHeight: probe.size,
      ...(probe.description === null ? {} : { description: bytesOf(probe.description) }),
    },
    containerColour: {
      primaries: 'bt2020',
      transfer: 'pq',
      matrix: 'bt2020-ncl',
      fullRange: false,
    },
    firstKey: frameBytes,
  });

  if (
    prepared === null ||
    (await VideoDecoder.isConfigSupported(prepared.config)).supported !== true
  ) {
    return 'notDecodable';
  }

  return new Promise((resolve) => {
    const decoder = new VideoDecoder({
      output: (frame) => {
        resolve(frame);
      },
      error: () => {
        resolve('notDecoded');
      },
    });

    decoder.configure(prepared.config);
    decoder.decode(
      new EncodedVideoChunk({ type: 'key', timestamp: 0, data: prepared.rewrite(frameBytes) }),
    );
    void decoder
      .flush()
      .then(() => {
        resolve('notDecoded');
      })
      .catch(() => {
        resolve('notDecoded');
      })
      .finally(() => {
        decoder.close();
      });
  });
};

/**
 * Whether Valence's own tone mapping can be trusted in this browser for a codec: it decodes a small
 * HDR frame of a known PQ grey through exactly the path a film takes, draws it through WebGPU
 * untouched, then reads back what arrived. The H.265 frame is 256 pixels square, since NVIDIA's
 * decoder refuses one of 64 and browsers bring no H.265 decoder of their own. The encoded grey
 * coming back means the browser left the HDR signal alone for the shader; anything else — the
 * browser converting the frame its own way, as it may where it does not honour the colour a decoder
 * is given — means the shader would be fed the wrong numbers, so HDR is left to the browser or the
 * server instead.
 *
 * @param codec - The codec, as Valence names it.
 * @returns How the check went: trusted where the signal arrives untouched, and otherwise where it
 *   stopped, with the grey that came back where the browser changed it.
 */
const checkToneMapping = async (codec: string): Promise<ToneMappingCheck> => {
  const probe = TONE_MAPPING_PROBES.find((one) => one.codec === codec);

  if (probe === undefined || typeof VideoDecoder === 'undefined') {
    return { outcome: 'notDecodable' };
  }

  if (!('gpu' in navigator)) {
    return { outcome: 'noWebGpu' };
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = adapter === null ? null : await adapter.requestDevice().catch(() => null);

  if (device === null) {
    return { outcome: 'noWebGpu' };
  }

  const frame = await decodeProbe(probe).catch(() => 'notDecoded' as const);

  if (typeof frame === 'string') {
    device.destroy();

    return { outcome: frame };
  }

  try {
    const { size } = probe;
    const rowBytes = Math.ceil((size * 4) / ROW_ALIGNMENT) * ROW_ALIGNMENT;
    const module = device.createShaderModule({ code: PICTURE_SHADER });
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: { module, entryPoint: 'fragmentMain', targets: [{ format: 'rgba8unorm' }] },
      primitive: { topology: 'triangle-list' },
    });
    const target = device.createTexture({
      size: [size, size],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    const grade = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM });
    const readback = device.createBuffer({
      size: rowBytes * size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: target.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(
      0,
      device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: device.createSampler() },
          { binding: 1, resource: device.importExternalTexture({ source: frame }) },
          { binding: 2, resource: { buffer: grade } },
        ],
      }),
    );
    pass.draw(3);
    pass.end();
    encoder.copyTextureToBuffer({ texture: target }, { buffer: readback, bytesPerRow: rowBytes }, [
      size,
      size,
    ]);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);

    const centre =
      new Uint8Array(readback.getMappedRange())[(size / 2) * rowBytes + (size / 2) * 4] ?? 0;

    return Math.abs(centre - ENCODED_GREY) <= TOLERANCE
      ? { outcome: 'trusted' }
      : { outcome: 'changed', grey: centre };
  } catch (error) {
    return { outcome: 'failed', reason: error instanceof Error ? error.message : String(error) };
  } finally {
    frame.close();
    device.destroy();
  }
};

export { checkToneMapping };
