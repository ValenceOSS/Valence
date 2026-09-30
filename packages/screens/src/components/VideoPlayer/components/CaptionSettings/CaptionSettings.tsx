import { Icon } from '@ValenceUI/Icon';
import { RotateCcw as RotateCcwIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Slider } from '@ValenceUI/Slider';
import { SwatchRow } from '@ValenceUI/SwatchRow';
import { CAPTION_COLOURS } from '@ValenceUI/captionColours';
import { CaptionField } from './components/CaptionField/CaptionField';
import { toCueDeclarations } from '@ValenceScreens/playback/captionStyle';
import type { CaptionSettingsProps } from './CaptionSettings.types';
import { say } from '@ValenceI18n/say';

const FONTS = [
  { id: 'sans', label: say('screens.videoPlayer.captionSettings.sans') },
  { id: 'serif', label: say('screens.videoPlayer.captionSettings.serif') },
  { id: 'mono', label: say('common.mono') },
  { id: 'casual', label: say('screens.videoPlayer.captionSettings.casual') },
] as const;

const OUTLINE_NAMES = [
  say('screens.videoPlayer.captionSettings.thin'),
  say('common.medium'),
  say('screens.videoPlayer.captionSettings.thick'),
  say('screens.videoPlayer.captionSettings.heavy'),
] as const;

const EDGES = [
  { id: 'none', label: say('common.none') },
  { id: 'outline', label: say('screens.videoPlayer.captionSettings.outline') },
  { id: 'shadow', label: say('common.shadow') },
  { id: 'raised', label: say('screens.videoPlayer.captionSettings.raised') },
] as const;

/**
 * Names a caption colour in words, for the answer beside a row of swatches.
 *
 * @param id - The colour, as a CSS colour.
 * @returns What it is called, or the colour itself where it is not one of the offered ones.
 */
const colourName = (id: string): string =>
  CAPTION_COLOURS.find((colour) => colour.id === id)?.label ?? id;

/**
 * Lets the person reading the captions decide how they look — font, size, colour, background and
 * edge, and how thick an outline is — with a sample drawn above in the style being chosen, every choice taking effect on the video
 * behind the panel as it is made, and a way back to the defaults for anyone who has made it worse.
 *
 * @param style - How captions are drawn at the moment.
 * @param onChange - Called with the whole style whenever any part of it changes.
 * @param onReset - Called to put every choice back to its default.
 */
const CaptionSettings = ({ style, onChange, onReset }: CaptionSettingsProps) => (
  <section
    aria-label={say('common.captionSettings')}
    className="flex w-full flex-col gap-5 text-sm text-text"
  >
    <div className="mx-2 flex h-20 items-end justify-center overflow-hidden rounded-md border border-[var(--surface-line)] bg-linear-to-b from-[var(--surface-hover)] to-[var(--surface-active)] p-3">
      <p
        aria-label={say('screens.videoPlayer.captionSettings.captionPreview')}
        className="line-clamp-2 rounded-sm px-1.5 text-center leading-snug [box-decoration-break:clone]"
        style={{
          ...toCueDeclarations(style),
          fontSize: `calc(0.75rem * ${(style.fontScale / 100).toString()})`,
        }}
      >
        {say('screens.videoPlayer.captionSettings.theQuickBrownFox')}
      </p>
    </div>

    <div className="flex flex-col gap-5 px-2">
      <CaptionField label={say('common.font')}>
        <SegmentedRow
          label={say('screens.videoPlayer.captionSettings.captionFont')}
          size="sm"
          fills
          items={FONTS}
          value={style.fontFamily}
          onSelect={(id) => {
            onChange({ ...style, fontFamily: FONTS.find((font) => font.id === id)?.id ?? 'sans' });
          }}
        />
      </CaptionField>

      <CaptionField label={say('common.size')} value={`${style.fontScale.toString()}%`}>
        <Slider
          label={say('screens.videoPlayer.captionSettings.captionSize')}
          tone="glass"
          value={style.fontScale}
          max={300}
          step={10}
          onValueChange={(value) => {
            onChange({ ...style, fontScale: Math.max(50, value) });
          }}
        />
      </CaptionField>

      <CaptionField
        label={say('screens.videoPlayer.captionSettings.textColour')}
        value={colourName(style.color)}
      >
        <SwatchRow
          label={say('screens.videoPlayer.captionSettings.captionTextColour')}
          swatches={CAPTION_COLOURS}
          value={style.color}
          onSelect={(id) => {
            onChange({ ...style, color: id });
          }}
        />
      </CaptionField>

      <CaptionField label={say('common.background')} value={colourName(style.backgroundColor)}>
        <SwatchRow
          label={say('screens.videoPlayer.captionSettings.captionBackgroundColour')}
          swatches={CAPTION_COLOURS}
          value={style.backgroundColor}
          onSelect={(id) => {
            onChange({ ...style, backgroundColor: id });
          }}
        />
      </CaptionField>

      <CaptionField
        label={say('screens.videoPlayer.captionSettings.backgroundOpacity')}
        value={`${Math.round(style.backgroundOpacity * 100).toString()}%`}
      >
        <Slider
          label={say('screens.videoPlayer.captionSettings.captionBackgroundOpacity')}
          tone="glass"
          value={Math.round(style.backgroundOpacity * 100)}
          max={100}
          step={5}
          onValueChange={(value) => {
            onChange({ ...style, backgroundOpacity: value / 100 });
          }}
        />
      </CaptionField>

      <CaptionField label={say('common.edge')}>
        <SegmentedRow
          label={say('screens.videoPlayer.captionSettings.captionEdge')}
          size="sm"
          fills
          items={EDGES}
          value={style.edgeStyle}
          onSelect={(id) => {
            onChange({
              ...style,
              edgeStyle: EDGES.find((edge) => edge.id === id)?.id ?? 'outline',
            });
          }}
        />
      </CaptionField>

      {style.edgeStyle !== 'outline' ? null : (
        <CaptionField
          label={say('screens.videoPlayer.captionSettings.outlineThickness')}
          value={OUTLINE_NAMES[style.outlineThickness - 1] ?? ''}
        >
          <Slider
            label={say('screens.videoPlayer.captionSettings.captionOutlineThickness')}
            tone="glass"
            value={style.outlineThickness - 1}
            max={3}
            step={1}
            onValueChange={(value) => {
              onChange({ ...style, outlineThickness: value + 1 });
            }}
          />
        </CaptionField>
      )}
    </div>

    <div className="border-t border-[var(--surface-line)] pt-1">
      <Button
        variant="row"
        size="none"
        onClick={onReset}
        className="items-center gap-4 px-3 py-2.5 text-sm font-semibold"
      >
        <Icon of={RotateCcwIcon} size={18} tone="muted" />
        {say('screens.videoPlayer.captionSettings.resetToDefaults')}
      </Button>
    </div>
  </section>
);

CaptionSettings.displayName = 'CaptionSettings';

export { CaptionSettings };
