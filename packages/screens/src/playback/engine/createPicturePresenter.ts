import { PICTURE_SHADER } from './PICTURE_SHADER';
import { fitWithin } from './fitWithin';
import type { HdrSignal } from './HdrSignal';

const SDR_WHITE_NITS = 203;

const SIGNALS: Readonly<Record<'sdr' | HdrSignal, number>> = { sdr: 0, pq: 1, hlg: 2 };

type Grade = {
  signal: 'sdr' | HdrSignal;
  isWideGamut: boolean;
  sourcePeakNits: number;
  quarterTurns: number;
};

type PicturePresenter = {
  gpu: string | null;
  grade: (grade: Grade) => void;
  show: (frame: VideoFrame, shape: { width: number; height: number }) => void;
  destroy: () => void;
};

/**
 * Draws decoded frames onto a canvas through WebGPU: each frame is handed to the GPU as an external
 * texture, without a copy through the page, and drawn at its own shape inside the canvas with black
 * bars for the rest. The canvas is kept at its laid-out size in device pixels, up to the largest
 * texture the GPU allows, and the last frame is drawn again whenever that size changes, so resizing
 * the window never leaves a stretched or empty picture.
 *
 * HDR frames that reach it as their encoded PQ or HLG signal are tone mapped on the way: decoded to
 * light, rolled off from the film's peak to SDR white with the BT.2390 curve on the brightest
 * channel, so colours keep their hue, and taken from BT.2020 to BT.709 where they are that wide.
 *
 * A picture filmed on its side, as a phone records one, is turned upright as it is drawn.
 *
 * It names the GPU it drew with, where the browser says, for anybody reading the stats.
 *
 * A GPU that is lost while the presenter is in use is reported, once, so the player can hand the
 * film to the server instead.
 *
 * @param canvas - Where to draw.
 * @param onLost - Told that the GPU went away.
 * @returns The presenter, or nothing where this browser has no WebGPU to draw with.
 */
const createPicturePresenter = async (
  canvas: HTMLCanvasElement,
  onLost: () => void,
): Promise<PicturePresenter | null> => {
  const adapter =
    'gpu' in navigator
      ? await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
      : null;
  const device = adapter === null ? null : await adapter.requestDevice().catch(() => null);
  const drawn = device === null ? null : canvas.getContext('webgpu');
  const context =
    typeof GPUCanvasContext !== 'undefined' && drawn instanceof GPUCanvasContext ? drawn : null;

  if (device === null || context === null) {
    device?.destroy();

    return null;
  }

  const life = { isOver: false };
  const format = navigator.gpu.getPreferredCanvasFormat();
  const module = device.createShaderModule({ code: PICTURE_SHADER });
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vertexMain' },
    fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  const grading = device.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const writeGrade = ({ signal, isWideGamut, sourcePeakNits, quarterTurns }: Grade) => {
    const values = new ArrayBuffer(32);

    new Uint32Array(values, 0, 2).set([SIGNALS[signal], isWideGamut ? 1 : 0]);
    new Float32Array(values, 8, 2).set([Math.max(sourcePeakNits, SDR_WHITE_NITS), SDR_WHITE_NITS]);
    new Uint32Array(values, 16, 1).set([((quarterTurns % 4) + 4) % 4]);
    device.queue.writeBuffer(grading, 0, values);
  };

  writeGrade({
    signal: 'sdr',
    isWideGamut: false,
    sourcePeakNits: SDR_WHITE_NITS,
    quarterTurns: 0,
  });
  const largest = device.limits.maxTextureDimension2D;

  context.configure({ device, format, alphaMode: 'opaque' });

  void device.lost.then(() => {
    if (!life.isOver) {
      onLost();
    }
  });

  const fitCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.min(largest, Math.max(1, Math.round(canvas.clientWidth * ratio)));
    const height = Math.min(largest, Math.max(1, Math.round(canvas.clientHeight * ratio)));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const named = `${adapter?.info.vendor ?? ''} ${adapter?.info.architecture ?? ''}`.trim();

  return {
    gpu: named === '' ? null : named,

    grade: writeGrade,

    show: (frame, shape) => {
      if (life.isOver) {
        return;
      }

      fitCanvas();

      const area = fitWithin(shape, { width: canvas.width, height: canvas.height });
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
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
            { binding: 0, resource: sampler },
            { binding: 1, resource: device.importExternalTexture({ source: frame }) },
            { binding: 2, resource: { buffer: grading } },
          ],
        }),
      );
      pass.setViewport(area.x, area.y, area.width, area.height, 0, 1);
      pass.draw(3);
      pass.end();
      device.queue.submit([encoder.finish()]);
    },

    destroy: () => {
      life.isOver = true;
      context.unconfigure();
      device.destroy();
    },
  };
};

export type { PicturePresenter };

export { createPicturePresenter };
