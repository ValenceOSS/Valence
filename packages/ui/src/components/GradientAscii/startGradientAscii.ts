import {
  blurShader,
  compositeShader,
  fieldShader,
  haloShader,
  vertexShader,
} from './gradientAsciiShaders';
import { toOklab } from './toOklab';
import type { GradientAsciiLook } from './GradientAscii.types';

type Program = { program: WebGLProgram; uniforms: Map<string, WebGLUniformLocation | null> };

type Target = {
  textures: (WebGLTexture | null)[];
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
};

type Atlas = { texture: WebGLTexture | null; count: number; columns: number; rows: number };

type Point = { x: number; y: number; age: number };

type Running = { wake: () => void; stop: () => void };

type Clock = {
  atlas: Atlas | null;
  atlasKey: string;
  paletteKey: string;
  time: number;
  glyphTime: number;
  intro: number;
  frameSeed: number;
  grainClock: number;
  raf: number;
  last: number;
  isVisible: boolean;
  isStopped: boolean;
};

const MAX_COLOURS = 8;

const MAX_CLICKS = 4;

const MAX_TRAIL = 24;

const CLICK_LIFE = 1.2;

const TRAIL_LIFE = 0.7;

const TRAIL_STEP = 0.015;

const INTRO_SECONDS = 2.4;

const SCRAMBLE_RADIUS = 0.1;

const ATLAS_CELL_W = 60;

const ATLAS_CELL_H = 100;

const ATLAS_COLUMNS = 16;

const FONT_SCALE = 0.78;

const SHAPES = { horizon: 0, pinch: 1, rise: 2, eclipse: 3 } as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const compile = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type);

  if (shader === null) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true) {
    return shader;
  }

  gl.deleteShader(shader);

  return null;
};

const link = (gl: WebGL2RenderingContext, fragmentSource: string): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (vertex === null || fragment === null) {
    gl.deleteProgram(program);

    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    gl.deleteProgram(program);

    return null;
  }

  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count = Number(gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS));

  for (let at = 0; at < count; at += 1) {
    const info = gl.getActiveUniform(program, at);

    if (info !== null) {
      const name = info.name.replace(/\[0\]$/u, '');

      uniforms.set(name, gl.getUniformLocation(program, name));
    }
  }

  return { program, uniforms };
};

const createTarget = (gl: WebGL2RenderingContext, count: number): Target => ({
  textures: Array.from({ length: count }, () => {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }),
  framebuffer: gl.createFramebuffer(),
  width: 0,
  height: 0,
});

const sizeTarget = (
  gl: WebGL2RenderingContext,
  target: Target,
  width: number,
  height: number,
): void => {
  if (target.width === width && target.height === height) {
    return;
  }

  target.width = width;
  target.height = height;
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  target.textures.forEach((texture, at) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + at, gl.TEXTURE_2D, texture, 0);
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

const buildAtlas = (gl: WebGL2RenderingContext, characters: string, fontFamily: string): Atlas => {
  const glyphs = [...new Set([...characters].filter((one) => one !== '\n' && one !== '\r'))];
  const list = glyphs.length === 0 ? [' '] : glyphs;
  const columns = Math.min(ATLAS_COLUMNS, list.length);
  const rows = Math.ceil(list.length / columns);
  const canvas = document.createElement('canvas');

  canvas.width = ATLAS_CELL_W * columns;
  canvas.height = ATLAS_CELL_H * rows;

  const context = canvas.getContext('2d');

  if (context !== null) {
    context.font = `300 ${Math.round(ATLAS_CELL_H * FONT_SCALE).toString()}px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff';
    list.forEach((glyph, at) => {
      context.fillText(
        glyph,
        (at % columns) * ATLAS_CELL_W + ATLAS_CELL_W / 2,
        Math.floor(at / columns) * ATLAS_CELL_H + ATLAS_CELL_H / 2 + 3,
      );
    });
  }

  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return { texture, count: list.length, columns, rows };
};

const age = (points: Point[], dt: number, life: number): void => {
  points.forEach((point) => {
    point.age += dt;
  });

  while ((points.at(-1)?.age ?? 0) > life) {
    points.pop();
  }
};

/**
 * Starts drawing a gradient written out in characters onto a canvas filling its container: a field
 * of colour in one of a few shapes, each cell of it a glyph picked by how bright the colour is
 * there, glowing over the colour itself. It scrambles the glyphs under the pointer and sends a ring
 * out from a click, draws only while its container is on screen, and stops moving for whoever asked
 * for stillness. Nothing happens where the browser has no WebGL 2.
 *
 * @param container - What the canvas fills, and where the pointer is watched.
 * @param canvas - Where it draws.
 * @param readLook - Reads how it should look now, so a change shows on the next frame.
 * @returns A way to wake it after a change, and to stop it for good, or null where it cannot draw.
 */
const startGradientAscii = (
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  readLook: () => GradientAsciiLook,
): Running | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });

  if (gl === null) {
    return null;
  }

  const field = link(gl, fieldShader);
  const halo = link(gl, haloShader);
  const blur = link(gl, blurShader);
  const composite = link(gl, compositeShader);

  if (field === null || halo === null || blur === null || composite === null) {
    return null;
  }

  const vao = gl.createVertexArray();
  const fieldTarget = createTarget(gl, 2);
  const haloA = createTarget(gl, 1);
  const haloB = createTarget(gl, 1);
  const view = { width: 1, height: 1, ratio: 1 };
  const ramp = new Float32Array(MAX_COLOURS * 3);
  const clickData = new Float32Array(MAX_CLICKS * 4);
  const clicks: Point[] = [];
  const trailData = new Float32Array(MAX_TRAIL * 4);
  const trail: Point[] = [];
  const pointer = { x: 0, y: 0, isInside: false };
  const state: Clock = {
    atlas: null,
    atlasKey: '',
    paletteKey: '',
    time: 0,
    glyphTime: 0,
    intro: readLook().isStill ? 1 : 0,
    frameSeed: 0,
    grainClock: 0,
    raf: 0,
    last: 0,
    isVisible: true,
    isStopped: false,
  };

  const uniform = (program: Program, name: string): WebGLUniformLocation | null =>
    program.uniforms.get(name) ?? null;

  const syncAtlas = (look: GradientAsciiLook): void => {
    const key = `${look.fontFamily}|${look.characters}`;

    if (key === state.atlasKey && state.atlas !== null) {
      return;
    }

    state.atlasKey = key;

    if (state.atlas !== null) {
      gl.deleteTexture(state.atlas.texture);
    }

    state.atlas = buildAtlas(gl, look.characters, look.fontFamily);

    void document.fonts.load(`300 64px ${look.fontFamily}`, look.characters).then(
      () => {
        if (state.isStopped || state.atlasKey !== key) {
          return;
        }

        if (state.atlas !== null) {
          gl.deleteTexture(state.atlas.texture);
        }

        state.atlas = buildAtlas(gl, look.characters, look.fontFamily);
        draw();
      },
      () => undefined,
    );
  };

  const paletteOf = (look: GradientAsciiLook): readonly string[] => {
    const colours = look.colours.slice(0, MAX_COLOURS);
    const first = colours[0] ?? '#ffffff';

    return colours.length > 1 ? colours : [first, first];
  };

  const syncPalette = (colours: readonly string[]): void => {
    const key = colours.join(',');

    if (key === state.paletteKey) {
      return;
    }

    state.paletteKey = key;
    colours.forEach((colour, at) => {
      ramp.set(toOklab(colour), at * 3);
    });
  };

  const bindGlyphs = (program: Program, look: GradientAsciiLook, atlas: Atlas): void => {
    const cellH = look.cellSize * view.ratio;
    const cellW = cellH * (ATLAS_CELL_W / ATLAS_CELL_H);
    const { width, height } = canvas;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTarget.textures[0] ?? null);
    gl.uniform1i(uniform(program, 'uField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fieldTarget.textures[1] ?? null);
    gl.uniform1i(uniform(program, 'uAux'), 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, atlas.texture);
    gl.uniform1i(uniform(program, 'uAtlas'), 2);
    gl.uniform2f(uniform(program, 'uResolution'), width, height);
    gl.uniform2f(uniform(program, 'uCell'), cellW, cellH);
    gl.uniform2f(
      uniform(program, 'uOffset'),
      (width - Math.ceil(width / cellW) * cellW) / 2,
      (height - Math.ceil(height / cellH) * cellH) / 2,
    );
    gl.uniform2f(uniform(program, 'uAtlasGrid'), atlas.columns, atlas.rows);
    gl.uniform1f(uniform(program, 'uCount'), atlas.count);
    gl.uniform1f(uniform(program, 'uDensity'), clamp(look.density, 0, 1));
    gl.uniform1f(uniform(program, 'uOpacity'), clamp(look.glyphOpacity, 0, 1));
    gl.uniform1f(uniform(program, 'uFlicker'), look.isStill ? 0 : clamp(look.flicker, 0, 1));
    gl.uniform1f(uniform(program, 'uGlyphTime'), state.glyphTime);
  };

  const draw = (): void => {
    const look = readLook();
    const colours = paletteOf(look);

    syncAtlas(look);
    syncPalette(colours);

    const { atlas } = state;

    if (atlas === null) {
      return;
    }

    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fieldTarget.framebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, fieldTarget.width, fieldTarget.height);
    gl.useProgram(field.program);
    gl.uniform1f(uniform(field, 'uAspect'), view.width / view.height);
    gl.uniform1f(uniform(field, 'uTime'), state.time);
    gl.uniform1i(uniform(field, 'uShape'), SHAPES[look.shape]);
    gl.uniform3fv(uniform(field, 'uRamp'), ramp);
    gl.uniform1i(uniform(field, 'uCount'), colours.length);
    gl.uniform1f(uniform(field, 'uSoftness'), clamp(look.softness, 0, 1));
    gl.uniform1f(uniform(field, 'uFlow'), clamp(look.flow, 0, 2));
    gl.uniform4fv(uniform(field, 'uTrail'), trailData);
    gl.uniform1f(uniform(field, 'uRadius'), SCRAMBLE_RADIUS);
    gl.uniform4fv(uniform(field, 'uClicks'), clickData);
    gl.uniform1f(uniform(field, 'uIntro'), state.intro);
    gl.uniform1f(uniform(field, 'uFrame'), state.frameSeed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const glow = clamp(look.glow, 0, 2);
    const isGlowing = glow > 0.001;

    if (isGlowing) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, haloA.framebuffer);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.viewport(0, 0, haloA.width, haloA.height);
      gl.useProgram(halo.program);
      bindGlyphs(halo, look, atlas);
      gl.uniform1f(uniform(halo, 'uDownscale'), canvas.width / haloA.width);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(blur.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(uniform(blur, 'uSource'), 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, haloB.framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, haloA.textures[0] ?? null);
      gl.uniform2f(uniform(blur, 'uStep'), 1 / haloA.width, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, haloA.framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, haloB.textures[0] ?? null);
      gl.uniform2f(uniform(blur, 'uStep'), 0, 1 / haloA.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(composite.program);
    bindGlyphs(composite, look, atlas);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, haloA.textures[0] ?? null);
    gl.uniform1i(uniform(composite, 'uHalo'), 3);
    gl.uniform1f(uniform(composite, 'uGlow'), isGlowing ? glow : 0);
    gl.uniform1f(uniform(composite, 'uGradient'), clamp(look.gradientOpacity, 0, 1));
    gl.uniform1f(uniform(composite, 'uGrain'), clamp(look.grain, 0, 0.4));
    gl.uniform1f(uniform(composite, 'uFrame'), state.frameSeed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const fillTrail = (): void => {
    for (let at = 0; at < MAX_TRAIL; at += 1) {
      const point = trail[at];

      if (point === undefined) {
        trailData[at * 4 + 2] = 0;
      } else {
        const left = 1 - point.age / TRAIL_LIFE;

        trailData.set([point.x, point.y, left * left, 0], at * 4);
      }
    }
  };

  const fillClicks = (): void => {
    for (let at = 0; at < MAX_CLICKS; at += 1) {
      const click = clicks[at];

      if (click === undefined) {
        clickData[at * 4 + 3] = 0;
      } else {
        const spent = click.age / CLICK_LIFE;
        const envelope = Math.min(1, click.age / 0.08) * (1 - spent) * (1 - spent);

        clickData.set([click.x, click.y, click.age, envelope], at * 4);
      }
    }
  };

  const frame = (now: number): void => {
    state.raf = 0;

    if (state.isStopped || !state.isVisible || document.hidden) {
      return;
    }

    const look = readLook();
    const dt = state.last === 0 ? 1 / 60 : clamp((now - state.last) / 1000, 0.001, 0.05);
    const speed = Math.max(0, look.speed);

    state.last = now;

    if (!look.isStill) {
      state.time += dt * speed * 0.5;
      state.glyphTime += dt * Math.max(speed, 0.15);
      state.grainClock += dt;

      if (state.grainClock > 1 / 24) {
        state.grainClock = 0;
        state.frameSeed = (state.frameSeed + 1) % 97;
      }
    }

    if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    }

    age(trail, dt, TRAIL_LIFE);
    age(clicks, dt, CLICK_LIFE);
    fillTrail();
    fillClicks();
    draw();

    if (!look.isStill || state.intro < 1 || clicks.length > 0 || trail.length > 0) {
      state.raf = requestAnimationFrame(frame);
    } else {
      state.last = 0;
    }
  };

  const wake = (): void => {
    if (state.raf === 0 && !state.isStopped && state.isVisible && !document.hidden) {
      state.raf = requestAnimationFrame(frame);
    }
  };

  const resize = (): void => {
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    sizeTarget(
      gl,
      fieldTarget,
      Math.max(1, Math.round(canvas.width / 2)),
      Math.max(1, Math.round(canvas.height / 2)),
    );

    const haloWidth = Math.max(1, Math.round(canvas.width / 4));
    const haloHeight = Math.max(1, Math.round(canvas.height / 4));

    sizeTarget(gl, haloA, haloWidth, haloHeight);
    sizeTarget(gl, haloB, haloWidth, haloHeight);
    draw();
    wake();
  };

  const locate = (event: PointerEvent): void => {
    const box = container.getBoundingClientRect();
    const x = (event.clientX - box.left) / Math.max(1, box.width);
    const y = 1 - (event.clientY - box.top) / Math.max(1, box.height);

    pointer.isInside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    pointer.x = (x - 0.5) * (box.width / Math.max(1, box.height));
    pointer.y = y - 0.5;
  };

  const mayTouch = (event: PointerEvent): boolean => {
    locate(event);

    const look = readLook();

    return pointer.isInside && look.isInteractive && !look.isStill;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!mayTouch(event)) {
      return;
    }

    const head = trail[0];
    const gap = head === undefined ? Infinity : Math.hypot(pointer.x - head.x, pointer.y - head.y);

    if (gap < TRAIL_STEP) {
      return;
    }

    if (head !== undefined && head.age < 0.1) {
      const steps = Math.min(6, Math.floor(gap / (TRAIL_STEP * 2)));

      for (let step = 1; step <= steps; step += 1) {
        const along = step / (steps + 1);

        trail.unshift({
          x: head.x + (pointer.x - head.x) * along,
          y: head.y + (pointer.y - head.y) * along,
          age: 0,
        });
      }
    }

    trail.unshift({ x: pointer.x, y: pointer.y, age: 0 });
    trail.length = Math.min(trail.length, MAX_TRAIL);
    wake();
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!mayTouch(event)) {
      return;
    }

    clicks.unshift({ x: pointer.x, y: pointer.y, age: 0 });

    if (clicks.length > MAX_CLICKS) {
      clicks.pop();
    }

    wake();
  };

  const onVisibility = (): void => {
    state.last = 0;
    wake();
  };

  const resizing = new ResizeObserver(resize);
  const watching = new IntersectionObserver((entries) => {
    state.isVisible = entries.some((entry) => entry.isIntersecting);

    if (state.isVisible) {
      state.last = 0;
      wake();
    }
  });

  resizing.observe(container);
  watching.observe(container);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  resize();

  return {
    wake,
    stop: () => {
      state.isStopped = true;
      cancelAnimationFrame(state.raf);
      resizing.disconnect();
      watching.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
      [fieldTarget, haloA, haloB].forEach((target) => {
        target.textures.forEach((texture) => {
          gl.deleteTexture(texture);
        });
        gl.deleteFramebuffer(target.framebuffer);
      });

      if (state.atlas !== null) {
        gl.deleteTexture(state.atlas.texture);
      }

      gl.deleteVertexArray(vao);
      [field, halo, blur, composite].forEach((one) => {
        gl.deleteProgram(one.program);
      });
    },
  };
};

export { startGradientAscii };
