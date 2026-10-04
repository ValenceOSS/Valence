/* oxlint-disable valence/no-hard-coded-strings -- debugging protocol methods and page scripts sent to the app, and a report for whoever runs the sweep, never shown in Valence */
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { judgeSweep } from './judgeSweep';
import { IDLE_ROUTES } from './IDLE_ROUTES';
import { planSweepRoutes } from './planSweepRoutes';
import type { SweepSample } from './SweepSample';

const TargetsSchema = z.array(
  z.object({ type: z.string(), url: z.string(), webSocketDebuggerUrl: z.string().optional() }),
);

const ReplySchema = z.object({
  id: z.number().optional(),
  result: z.record(z.string(), z.json()).optional(),
  error: z.object({ message: z.string() }).optional(),
});

const EvaluatedSchema = z.object({
  result: z.object({ value: z.json().optional() }),
});

const PointsSchema = z.array(z.tuple([z.number(), z.number()]));

const FoundSchema = z.object({ book: z.string().nullable(), film: z.string().nullable() });

const FIND_A_BOOK_AND_A_FILM = `(async () => {
  const books = await (await fetch('/api/books')).json();
  const libraries = await (await fetch('/api/libraries')).json();
  const films = libraries.find((one) => one.kind === 'movies');
  const page = films === undefined ? { items: [] } : await (await fetch('/api/libraries/' + films.id + '/items?limit=1')).json();
  return { book: books.books?.[0]?.id ?? null, film: page.items[0]?.id ?? null };
})()`;

const CARDS_IN_VIEW = `[...document.querySelectorAll('img')]
  .map((each) => each.getBoundingClientRect())
  .filter((box) => box.width > 60 && box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth)
  .slice(0, 12)
  .map((box) => [Math.round(box.left + box.width / 2), Math.round(box.top + box.height / 2)])`;

const SCROLL_TO_THE_END =
  "for (const each of [document.scrollingElement, ...document.querySelectorAll('*')]) { if (each && each.scrollHeight > each.clientHeight + 4) { each.scrollTop = each.scrollHeight; } }";

const SCROLL_TO_THE_TOP =
  "for (const each of [document.scrollingElement, ...document.querySelectorAll('*')]) { if (each) { each.scrollTop = 0; } }";

const MUTE_EVERY_VIDEO = `(() => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.muted = true; return play.call(this); };
})()`;

const HOVER_MS = 1200;

const IDLE_SAMPLE_MS = 30_000;

const PLAY_MS = 8000;

const MetricsSchema = z.object({
  metrics: z.array(z.object({ name: z.string(), value: z.number() })),
});

const SETTLE_MS = 2500;

const MB = 1024 * 1024;

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '9222' },
    passes: { type: 'string', default: '5' },
    origin: { type: 'string', default: 'valence://app' },
    only: { type: 'string', default: '' },
    'idle-minutes': { type: 'string', default: '2' },
  },
});

/**
 * Waits a while, so a page can settle after it is opened or scrolled.
 *
 * @param ms - How long.
 * @returns Once the time has passed.
 */
const pause = async (ms: number): Promise<void> =>
  new Promise((done) => {
    setTimeout(done, ms);
  });

/**
 * Connects to the first page of an app started with remote debugging, and gives back a way to send
 * it protocol commands.
 *
 * @param port - The remote debugging port.
 * @returns A way to send a command and wait for its answer, and a way to close the connection.
 */
const connect = async (port: string) => {
  const targets = TargetsSchema.parse(
    await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(),
  );
  const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);

  if (page?.webSocketDebuggerUrl === undefined) {
    throw new Error(`No page is open on port ${port}.`);
  }

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const waiting = new Map<
    number,
    (result: Record<string, z.infer<ReturnType<typeof z.json>>>) => void
  >();
  let next = 0;

  socket.addEventListener('message', (event) => {
    const reply = ReplySchema.safeParse(JSON.parse(String(event.data)));

    if (reply.success && reply.data.id !== undefined) {
      waiting.get(reply.data.id)?.(reply.data.result ?? {});
      waiting.delete(reply.data.id);
    }
  });

  await new Promise((opened) => {
    socket.addEventListener('open', opened, { once: true });
  });

  const send = async (method: string, params: Record<string, string | number | boolean> = {}) =>
    new Promise<Record<string, z.infer<ReturnType<typeof z.json>>>>((answered) => {
      next += 1;
      waiting.set(next, answered);
      socket.send(JSON.stringify({ id: next, method, params }));
    });

  return { send, close: () => socket.close() };
};

/**
 * Sweeps the app for leaks: every route in turn, a number of passes each, opening the page, resting
 * the mouse on each card in view long enough for its preview to open, scrolling everything to its
 * end and back, leaving and coming back, then collecting garbage and
 * measuring the heap, the DOM nodes and the listeners. A route whose numbers keep climbing pass
 * after pass leaks. The reader opens on the first book and the player on the first film, which
 * plays muted for a few seconds each pass. `--only` keeps to a comma-separated list of routes.
 *
 * Then each page that updates itself is left alone for `--idle-minutes` and measured every thirty
 * seconds, since what the ticket saw was the admin overview left open, not visited over and over.
 *
 * The window has to be on screen throughout. A hidden window draws nothing, so the browser never
 * cancels the animations of elements replaced while it is hidden and they stay alive: a hidden
 * sweep reports leaks the app does not have, and stops rather than do that. Start the app with
 * `VALENCE_DEBUG_PORT=9222`, signed in, before running this.
 */
const sweep = async (): Promise<void> => {
  const { send, close } = await connect(values.port);
  const passes = Number(values.passes);
  const samples: SweepSample[] = [];
  const open = async (route: string) => {
    await send('Runtime.evaluate', {
      expression: `history.pushState({}, '', ${JSON.stringify(route)}); dispatchEvent(new PopStateEvent('popstate'));`,
    });
    await pause(SETTLE_MS);
  };

  const evaluate = async (expression: string) =>
    EvaluatedSchema.parse(
      await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
    ).result.value;
  const measure = async (route: string, pass: number) => {
    if ((await evaluate('document.visibilityState')) !== 'visible') {
      close();
      throw new Error(
        'The window is hidden, so this sweep would report leaks the app does not have. Bring it on screen and run it again.',
      );
    }

    await send('HeapProfiler.collectGarbage');

    const { metrics } = MetricsSchema.parse(await send('Performance.getMetrics'));
    const metric = (name: string) => metrics.find((one) => one.name === name)?.value ?? 0;

    samples.push({
      route,
      pass,
      heapMb: metric('JSHeapUsedSize') / MB,
      nodes: metric('Nodes'),
      listeners: metric('JSEventListeners'),
    });
  };
  const hoverTheCards = async () => {
    for (const [x, y] of PointsSchema.parse(await evaluate(CARDS_IN_VIEW))) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await pause(HOVER_MS);
    }

    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
  };
  const chosen = values.only.split(',').filter((route) => route !== '');
  const routes = planSweepRoutes(FoundSchema.parse(await evaluate(FIND_A_BOOK_AND_A_FILM))).filter(
    (route) => chosen.length === 0 || chosen.includes(route),
  );

  await evaluate(MUTE_EVERY_VIDEO);
  await send('Performance.enable');

  for (const route of routes) {
    for (let pass = 1; pass <= passes; pass += 1) {
      await open(route);

      if (route.startsWith('/watch/')) {
        await pause(PLAY_MS);
      } else {
        await hoverTheCards();
        await evaluate(SCROLL_TO_THE_END);
        await pause(SETTLE_MS);
        await evaluate(SCROLL_TO_THE_TOP);
      }

      await open(route === '/' ? '/search' : '/');
      await open(route);
      await measure(route, pass);
    }
  }

  const idleSamples = Math.round((Number(values['idle-minutes']) * 60_000) / IDLE_SAMPLE_MS);

  for (const route of idleSamples === 0 ? [] : IDLE_ROUTES) {
    await open(route);

    for (let sample = 1; sample <= idleSamples + 1; sample += 1) {
      await measure(`${route} left open`, sample);
      await pause(IDLE_SAMPLE_MS);
    }
  }

  close();

  const findings = judgeSweep(samples);

  for (const found of findings) {
    process.stdout.write(
      `${found.isLeaking ? 'LEAKS' : 'ok   '} ${found.route.padEnd(26)} heap ${found.heapGrowthMb.toFixed(1)} MB, nodes ${found.nodeGrowth.toString()}, listeners ${found.listenerGrowth.toString()}\n`,
    );
  }

  process.exitCode = findings.some((found) => found.isLeaking) ? 1 : 0;
};

await sweep();
