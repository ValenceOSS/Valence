import { PICTURE_SHADER } from './PICTURE_SHADER';
import { TONE_MAPPING_PROBES } from './TONE_MAPPING_PROBES';
import { bytesOf } from './hevc/bytesOf';
import { prepareHdrDecoding } from './prepareHdrDecoding';

const TOLERANCE = 8;

const SIZE = 64;

const ENCODED_GREY = 128;

type Probe = (typeof TONE_MAPPING_PROBES)[number];

const ROW_BYTES = 256;

/**
 * Decodes a probe's one frame the way an HDR film of its codec is decoded for tone mapping.
 *
 * @param probe - The probe.
 * @returns The frame, or nothing where this browser will not decode it.
 */
const decodeProbe = async (probe: Probe): Promise<VideoFrame | null> => {
  const frameBytes = bytesOf(probe.frame);
  const prepared = prepareHdrDecoding({
    codec: probe.codec,
    config: {
      codec: probe.config,
      codedWidth: SIZE,
      codedHeight: SIZE,
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
    return null;
  }

  return new Promise((resolve) => {
    const decoder = new VideoDecoder({
      output: (frame) => {
        resolve(frame);
      },
      error: () => {
        resolve(null);
      },
    });

    decoder.configure(prepared.config);
    decoder.decode(
      new EncodedVideoChunk({ type: 'key', timestamp: 0, data: prepared.rewrite(frameBytes) }),
    );
    void decoder
      .flush()
      .catch(() => {
        resolve(null);
      })
      .finally(() => {
        decoder.close();
      });
  });
};

/**
 * Whether Valence's own tone mapping can be trusted in this browser for a codec: it decodes a tiny
 * HDR frame of a known PQ grey through exactly the path a film takes and draws it through WebGPU untouched,
 * then reads back what arrived. The encoded grey coming back means the browser left the HDR signal
 * alone for the shader; anything else — the browser converting the frame its own way, as it may
 * where it does not honour the colour a decoder is given — means the shader would be fed the wrong
 * numbers, so HDR is left to the browser or the server instead.
 *
 * @param codec - The codec, as Valence names it.
 * @returns Whether the signal arrives untouched.
 */
const checkToneMapping = async (codec: string): Promise<boolean> => {
  const probe = TONE_MAPPING_PROBES.find((one) => one.codec === codec);

  if (probe === undefined || typeof VideoDecoder === 'undefined' || !('gpu' in navigator)) {
    return false;
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = adapter === null ? null : await adapter.requestDevice().catch(() => null);
  const frame = device === null ? null : await decodeProbe(probe).catch(() => null);

  if (device === null || frame === null) {
    frame?.close();
    device?.destroy();

    return false;
  }

  try {
    const size = SIZE;
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
      size: ROW_BYTES * size,
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
    encoder.copyTextureToBuffer({ texture: target }, { buffer: readback, bytesPerRow: ROW_BYTES }, [
      size,
      size,
    ]);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);

    const centre = new Uint8Array(readback.getMappedRange())[
      (size / 2) * ROW_BYTES + (size / 2) * 4
    ];

    return centre !== undefined && Math.abs(centre - ENCODED_GREY) <= TOLERANCE;
  } catch {
    return false;
  } finally {
    frame.close();
    device.destroy();
  }
};

export { checkToneMapping };
