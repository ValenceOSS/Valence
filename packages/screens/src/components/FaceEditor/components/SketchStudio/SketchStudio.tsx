import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  Delete as DeleteIcon,
  FaceSmilePlus as StickerIcon,
  RotateCcw as UndoIcon,
  RotateCw as RedoIcon,
  X as ClearIcon,
  TypeOutline as TextIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { Slider } from '@ValenceUI/Slider';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { SKETCH_SPACE } from '@ValenceContracts/schemas/SketchScene';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { SKETCH_TOOLS } from '@ValenceScreens/components/FaceEditor/components/SketchStudio/SKETCH_TOOLS';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import { drawScene } from '@ValenceScreens/library/sketch/drawScene';
import { itemAt } from '@ValenceScreens/library/sketch/itemAt';
import { STICKERS } from '@ValenceScreens/library/sketch/STICKERS';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { SketchItem, SketchScene, SketchStroke } from '@ValenceContracts/schemas/SketchScene';
import type { SketchStudioProps, SketchTool } from './SketchStudio.types';

const MOST_ITEMS = 400;

const MOST_POINTS = 4000;

/**
 * Where a pointer is on the board, in the sketch's own square of units.
 *
 * @param event - The pointer.
 */
const boardPlace = (event: PointerEvent<HTMLCanvasElement>): [number, number] => {
  const box = event.currentTarget.getBoundingClientRect();

  return [
    ((event.clientX - box.left) / box.width) * SKETCH_SPACE,
    ((event.clientY - box.top) / box.height) * SKETCH_SPACE,
  ];
};

/**
 * A whiteboard to draw a face on: pens, a pencil, a marker and an eraser in any colour and size,
 * words in any of the letter fonts, and stickers, each of which can be picked up, moved, grown,
 * turned or taken off again. Every change can be undone and redone.
 *
 * The drawing is kept as what was drawn rather than as a picture of it, so it can be opened again
 * and carried on with later. The circle over the board shows what will be seen where Valence draws
 * faces round.
 *
 * @param scene - The drawing as it stands.
 * @param onChange - Told the drawing changed.
 */
const SketchStudio = ({ scene, onChange }: SketchStudioProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<SketchStroke | null>(null);
  const dragging = useRef<{ at: number; from: [number, number]; start: [number, number] } | null>(
    null,
  );
  const [tool, setTool] = useState<SketchTool>('pen');
  const [colour, setColour] = useState<string>(PROFILE_COLOURS[17]);
  const [size, setSize] = useState(14);
  const [words, setWords] = useState('');
  const [font, setFont] = useState<LetterFont>('gilroy');
  const [selected, setSelected] = useState<number | null>(null);
  const [isWordsOpen, setIsWordsOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [past, setPast] = useState<SketchScene[]>([]);
  const [future, setFuture] = useState<SketchScene[]>([]);

  const paintBoard = (showing: SketchScene) => {
    const target = canvas.current;
    const paint = target?.getContext('2d');

    if (target === null || paint === null || paint === undefined) {
      return;
    }

    drawScene(paint, showing, target.width);
  };

  useEffect(() => {
    const target = canvas.current;

    if (target !== null) {
      const across = Math.round(target.clientWidth * Math.min(window.devicePixelRatio, 2));

      target.width = across;
      target.height = across;
    }
  }, []);

  useEffect(() => {
    paintBoard(scene);
  });

  const commit = (next: SketchScene) => {
    setPast((before) => [...before.slice(-49), scene]);
    setFuture([]);
    onChange(next);
  };

  const place = (item: SketchItem) => {
    if (scene.items.length >= MOST_ITEMS) {
      return;
    }

    commit({ ...scene, items: [...scene.items, item] });
    setSelected(scene.items.length);
    setTool('move');
  };

  const change = (at: number, update: (item: SketchItem) => SketchItem) => {
    commit({
      ...scene,
      items: scene.items.map((item, index) => (index === at ? update(item) : item)),
    });
  };

  const chosen = selected === null ? undefined : scene.items[selected];
  const isDrawingTool =
    tool === 'pen' || tool === 'pencil' || tool === 'marker' || tool === 'eraser';

  const undo = () => {
    const previous = past.at(-1);

    if (previous !== undefined) {
      setPast(past.slice(0, -1));
      setFuture([scene, ...future]);
      setSelected(null);
      onChange(previous);
    }
  };

  const redo = () => {
    const [next, ...rest] = future;

    if (next !== undefined) {
      setPast([...past, scene]);
      setFuture(rest);
      setSelected(null);
      onChange(next);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {SKETCH_TOOLS.map((one) => (
          <Button
            key={one.id}
            variant="secondary"
            size="sm"
            isIconOnly
            label={one.label}
            isActive={tool === one.id}
            className={cn(tool === one.id && 'ring-2 ring-accent')}
            onClick={() => {
              setTool(one.id);

              if (one.id !== 'move') {
                setSelected(null);
              }
            }}
          >
            <Icon of={one.icon} size={16} />
          </Button>
        ))}

        <span className="my-1 h-px w-6 bg-line" />

        <ColourChoice isCompact label="Ink" value={colour} onChange={setColour} />

        <PopoverPanel
          label="Size"
          side="bottom"
          align="start"
          isBare
          trigger={
            <span className="flex size-8 items-center justify-center rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text hover:bg-[var(--surface-active)]">
              <span
                style={{ width: `${Math.max(3, Math.min(size, 60) / 2.4).toString()}px` }}
                className="aspect-square rounded-full bg-text"
              />
            </span>
          }
        >
          <div className="flex w-56 flex-col gap-2 p-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-text">Size</span>
              <span className="font-mono text-[0.7rem] text-text-muted">{size}</span>
            </div>
            <Slider
              label="Size"
              value={size - 2}
              max={78}
              valueLabel={(at) => (at + 2).toString()}
              onValueChange={(at) => {
                setSize(at + 2);
              }}
            />
          </div>
        </PopoverPanel>

        <span className="my-1 h-px w-6 bg-line" />

        <PopoverPanel
          label="Add words"
          side="bottom"
          align="start"
          isOpen={isWordsOpen}
          onOpenChange={setIsWordsOpen}
          isBare
          trigger={
            <span className="flex size-8 items-center justify-center rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text hover:bg-[var(--surface-active)]">
              <Icon of={TextIcon} size={16} />
            </span>
          }
        >
          <div className="flex w-72 flex-col gap-3 p-1">
            <div className="flex items-center gap-2">
              <TextField
                label="Words to add"
                isLabelHidden
                value={words}
                placeholder="Say something"
                size="sm"
                hasFocusOnMount
                className="flex-1"
                onValueChange={(next) => {
                  setWords(next.slice(0, 40));
                }}
              />
              <ColourChoice
                isCompact
                label="Colour of the words"
                value={colour}
                onChange={setColour}
              />
            </div>
            <div className="grid grid-cols-4 gap-1">
              {LETTER_FONTS.map((option) => (
                <Button
                  key={option}
                  variant={option === font ? 'secondary' : 'ghost'}
                  size="xs"
                  isActive={option === font}
                  style={{
                    fontFamily: LETTER_FONT_LOOKS[option].family,
                    fontWeight: LETTER_FONT_LOOKS[option].weight,
                  }}
                  onClick={() => {
                    setFont(option);
                  }}
                >
                  {LETTER_FONT_LOOKS[option].name}
                </Button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={words.trim() === ''}
              onClick={() => {
                place({
                  kind: 'text',
                  text: words.trim(),
                  font,
                  colour,
                  x: SKETCH_SPACE / 2,
                  y: SKETCH_SPACE / 2,
                  size: 140,
                  turn: 0,
                });
                setWords('');
                setIsWordsOpen(false);
              }}
            >
              Put it on
            </Button>
          </div>
        </PopoverPanel>

        <PopoverPanel
          label="Add a sticker"
          side="bottom"
          align="start"
          isOpen={isStickersOpen}
          onOpenChange={setIsStickersOpen}
          isBare
          trigger={
            <span className="flex size-8 items-center justify-center rounded-md border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text hover:bg-[var(--surface-active)]">
              <Icon of={StickerIcon} size={16} />
            </span>
          }
        >
          <div className="grid w-72 grid-cols-8 gap-1 p-1">
            {STICKERS.map((sticker) => (
              <Button
                key={sticker}
                variant="ghost"
                size="none"
                label={`Add ${sticker}`}
                hasTooltip={false}
                className="aspect-square text-xl transition-transform hover-hover:hover:scale-110"
                onClick={() => {
                  place({
                    kind: 'sticker',
                    sticker,
                    x: SKETCH_SPACE / 2,
                    y: SKETCH_SPACE / 2,
                    size: 260,
                    turn: 0,
                  });
                  setIsStickersOpen(false);
                }}
              >
                {sticker}
              </Button>
            ))}
          </div>
        </PopoverPanel>

        <span className="my-1 h-px w-6 bg-line" />

        <ColourChoice
          isCompact
          label="Background"
          value={scene.background}
          onChange={(hex) => {
            commit({ ...scene, background: hex });
          }}
        />

        <span className="my-1 h-px w-6 bg-line" />

        <span className="flex flex-col items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            label="Undo"
            disabled={past.length === 0}
            onClick={undo}
          >
            <Icon of={UndoIcon} size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            label="Redo"
            disabled={future.length === 0}
            onClick={redo}
          >
            <Icon of={RedoIcon} size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            label="Start again"
            disabled={scene.items.length === 0}
            onClick={() => {
              setSelected(null);
              commit({ ...scene, items: [] });
            }}
          >
            <Icon of={ClearIcon} size={16} />
          </Button>
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {chosen !== undefined && chosen.kind !== 'stroke' && selected !== null ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-subtle px-3 py-2">
            <span className="max-w-32 truncate text-sm text-text">
              {chosen.kind === 'text' ? `“${chosen.text}”` : chosen.sticker}
            </span>
            <div className="flex min-w-32 flex-1 items-center gap-2">
              <span className="text-xs text-text-muted">Size</span>
              <Slider
                label="Size"
                value={Math.round(chosen.size) - 10}
                max={chosen.kind === 'text' ? 790 : 990}
                onValueChange={(at) => {
                  change(selected, (item) =>
                    item.kind === 'stroke' ? item : { ...item, size: at + 10 },
                  );
                }}
              />
            </div>
            <div className="flex min-w-32 flex-1 items-center gap-2">
              <span className="text-xs text-text-muted">Turn</span>
              <Slider
                label="Turn"
                value={Math.round(chosen.turn) + 180}
                max={360}
                valueLabel={(at) => `${(at - 180).toString()}°`}
                onValueChange={(at) => {
                  change(selected, (item) =>
                    item.kind === 'stroke' ? item : { ...item, turn: at - 180 },
                  );
                }}
              />
            </div>
            {chosen.kind === 'text' ? (
              <ColourChoice
                isCompact
                label="Colour of the words"
                value={chosen.colour}
                onChange={(hex) => {
                  change(selected, (item) =>
                    item.kind === 'text' ? { ...item, colour: hex } : item,
                  );
                }}
              />
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              label="Take it off"
              onClick={() => {
                commit({ ...scene, items: scene.items.filter((_, index) => index !== selected) });
                setSelected(null);
              }}
            >
              <Icon of={DeleteIcon} size={15} />
            </Button>
          </div>
        ) : (
          <p className="px-1 text-xs text-text-muted">
            {tool === 'move'
              ? 'Press a word or a sticker to move it; then size and turn it here.'
              : 'Draw on the board. Add words and stickers from the bar, then move them with the arrow.'}
          </p>
        )}

        <div className="relative w-full max-w-[26rem]">
          <canvas
            ref={canvas}
            aria-label="Your drawing"
            role="img"
            onPointerDown={(event) => {
              const [x, y] = boardPlace(event);

              event.currentTarget.setPointerCapture(event.pointerId);

              if (tool === 'move') {
                const at = itemAt(scene, x, y);
                const item = at === null ? undefined : scene.items[at];

                setSelected(at);

                if (at !== null && item !== undefined && item.kind !== 'stroke') {
                  dragging.current = { at, from: [x, y], start: [item.x, item.y] };
                }

                return;
              }

              if (isDrawingTool) {
                drawing.current = {
                  kind: 'stroke',
                  tool,
                  colour,
                  size,
                  points: [[x, y, event.pressure === 0 ? 0.5 : event.pressure]],
                };
                paintBoard({ ...scene, items: [...scene.items, drawing.current] });
              }
            }}
            onPointerMove={(event) => {
              const [x, y] = boardPlace(event);
              const stroke = drawing.current;
              const drag = dragging.current;

              if (stroke !== null) {
                const last = stroke.points.at(-1);

                if (
                  stroke.points.length < MOST_POINTS &&
                  (last === undefined || Math.hypot(x - last[0], y - last[1]) > 1.5)
                ) {
                  stroke.points.push([x, y, event.pressure === 0 ? 0.5 : event.pressure]);
                  paintBoard({ ...scene, items: [...scene.items, stroke] });
                }
              }

              if (drag !== null) {
                const moved = scene.items.map((item, index) =>
                  index === drag.at && item.kind !== 'stroke'
                    ? {
                        ...item,
                        x: drag.start[0] + x - drag.from[0],
                        y: drag.start[1] + y - drag.from[1],
                      }
                    : item,
                );

                paintBoard({ ...scene, items: moved });
              }
            }}
            onPointerUp={(event) => {
              const [x, y] = boardPlace(event);
              const stroke = drawing.current;
              const drag = dragging.current;

              drawing.current = null;
              dragging.current = null;

              if (stroke !== null && scene.items.length < MOST_ITEMS) {
                commit({ ...scene, items: [...scene.items, stroke] });
              }

              if (drag !== null && (x !== drag.from[0] || y !== drag.from[1])) {
                change(drag.at, (item) =>
                  item.kind === 'stroke'
                    ? item
                    : {
                        ...item,
                        x: drag.start[0] + x - drag.from[0],
                        y: drag.start[1] + y - drag.from[1],
                      },
                );
              }
            }}
            className={cn(
              'block aspect-square w-full touch-none rounded-2xl ring-1 ring-line',
              tool === 'move' ? 'cursor-grab' : 'cursor-crosshair',
            )}
          />
          <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-text/40" />
        </div>
      </div>
    </div>
  );
};

SketchStudio.displayName = 'SketchStudio';

export { SketchStudio };
