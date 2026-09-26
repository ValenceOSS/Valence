import { ORB_PRELUDE } from '@ValenceUI/orbs/ORB_PRELUDE';
import type { OrbLook } from '@ValenceUI/orbs/OrbLook';
import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

type Showing = {
  target: HTMLCanvasElement;
  variant: OrbVariant;
  look: () => OrbLook;
  isStill: boolean;
  across: number | null;
  anim: number;
  clocks: Record<string, number>;
  isDrawn: boolean;
};

type Program = {
  program: WebGLProgram;
  where: Record<string, WebGLUniformLocation | null>;
};

const VERTEX = 'attribute vec2 aPos;\nvoid main() { gl_Position = vec4(aPos, 0.0, 1.0); }';

const RESTING_OUTPUT = 0.3;

const RESTING_SPEED = 0.1 + (1 - (RESTING_OUTPUT - 1) ** 2) * 0.9;

const MOST_PIXELS_ACROSS = 512;

const showings = new Set<Showing>();

const programs = new Map<string, Program | null>();

let stage: { canvas: HTMLCanvasElement; gl: WebGLRenderingContext } | null = null;

let frame = 0;

let lastTick = 0;

/**
 * The one WebGL context every orb on the page is drawn with, made the first time an orb needs it.
 *
 * @returns The context, or nothing where the browser has no WebGL to give.
 */
const theStage = (): { canvas: HTMLCanvasElement; gl: WebGLRenderingContext } | null => {
  if (stage !== null) {
    return stage;
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: true });

  if (gl === null) {
    return null;
  }

  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  stage = { canvas, gl };

  return stage;
};

/**
 * Compiles one stage of a shader, or answers nothing where the GPU refuses it.
 *
 * @param gl - The context.
 * @param kind - Which stage.
 * @param source - Its GLSL.
 */
const compile = (gl: WebGLRenderingContext, kind: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(kind);

  if (shader === null) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true ? shader : null;
};

/**
 * The linked program for one kind of orb, built once and kept, with where each of its uniforms
 * lives.
 *
 * @param gl - The context.
 * @param variant - The kind of orb.
 */
const programFor = (gl: WebGLRenderingContext, variant: OrbVariant): Program | null => {
  const known = programs.get(variant.key);

  if (known !== undefined) {
    return known;
  }

  const declarations = [
    ...variant.params.map((param) => `uniform float uP_${param.key};`),
    ...variant.colours.map((colour) => `uniform vec3 uC_${colour.key};`),
  ].join('\n');
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(
    gl,
    gl.FRAGMENT_SHADER,
    `${ORB_PRELUDE}\n${declarations}\n${variant.shader}`,
  );
  const program = gl.createProgram();

  if (vertex === null || fragment === null) {
    programs.set(variant.key, null);

    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    programs.set(variant.key, null);

    return null;
  }

  const names = [
    'uRes',
    'uTime',
    'uAnim',
    'uInput',
    'uOutput',
    ...variant.params.map((param) => `uP_${param.key}`),
    ...variant.colours.map((colour) => `uC_${colour.key}`),
  ];
  const built = {
    program,
    where: Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)])),
  };

  programs.set(variant.key, built);

  return built;
};

/**
 * Turns `#rrggbb` into the three channels a shader reads, each from nothing to one.
 *
 * @param hex - The colour.
 */
const channels = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace('#', ''), 16);

  return Number.isNaN(value)
    ? [1, 1, 1]
    : [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

/**
 * Draws one orb's next frame on the shared context and copies it onto that orb's own canvas.
 *
 * @param showing - The orb.
 * @param seconds - The time now.
 * @param step - How long since the last frame.
 */
const draw = (showing: Showing, seconds: number, step: number): void => {
  const ready = theStage();
  const { target, variant } = showing;
  const across =
    showing.across ??
    Math.min(
      Math.round(target.clientWidth * Math.min(window.devicePixelRatio, 2)),
      MOST_PIXELS_ACROSS,
    );

  if (ready === null || across === 0) {
    return;
  }

  const built = programFor(ready.gl, variant);
  const { gl, canvas } = ready;

  if (built === null) {
    return;
  }

  if (canvas.width !== across || canvas.height !== across) {
    canvas.width = across;
    canvas.height = across;
  }

  const { params, colours } = showing.look();

  showing.anim += step * RESTING_SPEED;
  gl.viewport(0, 0, across, across);
  gl.useProgram(built.program);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(built.where['uRes'] ?? null, across, across);
  gl.uniform1f(built.where['uTime'] ?? null, seconds * 0.5);
  gl.uniform1f(built.where['uAnim'] ?? null, showing.anim);
  gl.uniform1f(built.where['uInput'] ?? null, 0);
  gl.uniform1f(built.where['uOutput'] ?? null, RESTING_OUTPUT);

  for (const param of variant.params) {
    const value = params[param.key] ?? param.standard;

    if (param.isRate === true) {
      showing.clocks[param.key] = (showing.clocks[param.key] ?? 0) + step * RESTING_SPEED * value;
    }

    gl.uniform1f(
      built.where[`uP_${param.key}`] ?? null,
      param.isRate === true ? (showing.clocks[param.key] ?? 0) : value,
    );
  }

  for (const colour of variant.colours) {
    const [red, green, blue] = channels(colours[colour.key] ?? colour.standard);

    gl.uniform3f(built.where[`uC_${colour.key}`] ?? null, red, green, blue);
  }

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  if (target.width !== across || target.height !== across) {
    target.width = across;
    target.height = across;
  }

  const paint = target.getContext('2d');

  paint?.clearRect(0, 0, across, across);
  paint?.drawImage(canvas, 0, 0);
  showing.isDrawn = true;
};

/**
 * Draws every orb that is moving, and every still one not drawn yet, then asks for the next frame
 * while any of them still moves.
 *
 * @param now - The time of this frame, from the browser.
 */
const tick = (now: number): void => {
  const seconds = now / 1000;
  const step = lastTick === 0 ? 0 : Math.min(seconds - lastTick, 0.1);

  lastTick = seconds;

  for (const showing of showings) {
    if (!showing.isStill || !showing.isDrawn) {
      draw(showing, seconds, step);
    }
  }

  const isMoving = [...showings].some((showing) => !showing.isStill);

  frame = isMoving ? requestAnimationFrame(tick) : 0;

  if (!isMoving) {
    lastTick = 0;
  }
};

/**
 * Shows an orb on a canvas, moving or still, for as long as it is wanted. Every orb on the page is
 * drawn through one WebGL context and copied onto its own canvas, because a browser only hands out
 * a few contexts and a page of faces would run out of them.
 *
 * @param target - The canvas to draw the orb on.
 * @param variant - Which orb.
 * @param look - Reads its settings at each frame, so a change shows at the next one.
 * @param how - Whether to draw it once rather than keep it moving, and how many pixels across to
 *   draw it where the canvas's own size on the page should not decide.
 * @returns Stops showing it, and redraws it when its settings change while it is still.
 */
const showOrb = (
  target: HTMLCanvasElement,
  variant: OrbVariant,
  look: () => OrbLook,
  how: { isStill: boolean; across?: number },
): { stop: () => void; redraw: () => void } => {
  const showing: Showing = {
    target,
    variant,
    look,
    isStill: how.isStill,
    across: how.across ?? null,
    anim: Math.random() * 100,
    clocks: {},
    isDrawn: false,
  };

  showings.add(showing);

  if (frame === 0) {
    frame = requestAnimationFrame(tick);
  }

  return {
    stop: () => {
      showings.delete(showing);
    },
    redraw: () => {
      showing.isDrawn = false;

      if (frame === 0) {
        frame = requestAnimationFrame(tick);
      }
    },
  };
};

export { showOrb };
