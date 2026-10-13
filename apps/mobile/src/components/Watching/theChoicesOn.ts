import { describeAudioTrack } from '@ValenceCore/functions/describeTrack';
import { listAvailableQualitySteps } from '@ValenceCore/functions/listAvailableQualitySteps';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { originalLabel } from '@ValenceCore/functions/originalLabel';
import { qualityStepCostsFor } from '@ValenceClient/playback/qualityStepCostsFor';
import { stepsThatSaveNothing } from '@ValenceClient/playback/stepsThatSaveNothing';
import { qualityStepDetail } from '@ValenceClient/playback/qualityStepDetail';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import { SUBTITLES_OFF } from '@ValenceClient/playback/fetchSubtitles';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import { QualityPreferenceSchema } from '@ValenceClient/playback/qualityPreference';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import { captionChoices } from '@ValenceClient/playback/captionChoices';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { ASetOfChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices.types';
import { say } from '@ValenceI18n/say';

const AS_SENT = 'original';

const ADAPTIVE = 'auto';

type WhatThereIsToChoose = {
  streams: readonly AudioStream[];
  subtitles: readonly SubtitleTrack[];
  chosenSubtitle: string;
  onSubtitle: (trackId: string) => void;
  media: MediaDetail | null;
  profile: DeviceProfile;
  chosenAudio: number | null;
  chosenQuality: QualityPreference;
  onAudio: (streamIndex: number) => void;
  onQuality: (quality: QualityPreference) => void;
  captionStyle: CaptionStyle;
  onCaptionStyle: (style: CaptionStyle) => void;
};

type ThePlayersChoices = {
  subtitles: ASetOfChoices | null;
  audio: ASetOfChoices | null;
  quality: ASetOfChoices | null;
  captions: ASetOfChoices[];
};

/**
 * What there is to choose about a particular film on a particular phone, one set for each panel
 * that offers it: the subtitles, the sound, the quality, and how the words are drawn.
 *
 * The sound and the quality are given to the server rather than acted on here: a session is one
 * picture with one sound on it, chosen when it starts, so changing either means asking for a new
 * one. Auto asks for every copy the server keeps beside the film, and the phone's own player moves
 * between them as the connection allows.
 *
 * A set with one thing in it is left out, since a choice between one option and nothing is not a
 * choice. Subtitles are the exception, because off is a real answer there.
 *
 * @param streams - The soundtracks the file carries.
 * @param subtitles - The subtitle tracks there are to read.
 * @param chosenSubtitle - Which is being read, or off.
 * @param onSubtitle - Told which one they want.
 * @param media - The file itself, which decides what qualities are worth offering.
 * @param profile - What this phone can play, which decides what each quality would cost.
 * @param chosenAudio - Which soundtrack is playing, or none chosen and the file's own default.
 * @param chosenQuality - What was asked for: auto, the file as it is, or a step down.
 * @param onAudio - Told which soundtrack they want.
 * @param onQuality - Told how much of their connection to spend.
 * @param captionStyle - How the lines are drawn, whose parts are offered while a track is read.
 * @param onCaptionStyle - Told the whole style whenever one part of it changes.
 * @returns The sets, each where there is anything to choose.
 */
const theChoicesOn = ({
  streams,
  subtitles,
  chosenSubtitle,
  onSubtitle,
  media,
  profile,
  chosenAudio,
  chosenQuality,
  onAudio,
  onQuality,
  captionStyle,
  onCaptionStyle,
}: WhatThereIsToChoose): ThePlayersChoices => {
  const subtitleSet: ASetOfChoices | null =
    subtitles.length === 0
      ? null
      : {
          heading: say('common.subtitles'),
          chosen: chosenSubtitle,
          choices: [
            { id: SUBTITLES_OFF, label: say('common.off') },
            ...subtitles.map((track) => ({
              id: track.id,
              label: track.label,
              detail: track.format.toUpperCase(),
            })),
          ],
          onChoose: onSubtitle,
        };

  const captions =
    subtitles.length > 0 && chosenSubtitle !== SUBTITLES_OFF
      ? captionChoices(captionStyle).map((set) => ({
          heading: set.heading,
          chosen: set.chosen,
          choices: set.choices,
          onChoose: (id: string) => {
            onCaptionStyle(set.choose(id));
          },
        }))
      : [];

  const audio: ASetOfChoices | null =
    streams.length > 1
      ? {
          heading: say('common.audio'),
          chosen: (
            chosenAudio ??
            streams.find((one) => one.isDefault)?.index ??
            streams[0]?.index ??
            0
          ).toString(),
          choices: streams.map((stream, place) => ({
            id: stream.index.toString(),
            label: describeAudioTrack(stream, place + 1),
          })),
          onChoose: (id) => {
            onAudio(Number(id));
          },
        }
      : null;

  const rungs = media === null ? [] : listAvailableQualitySteps(media);
  const costs = media === null ? {} : qualityStepCostsFor({ media, profile });
  const savingNothing = media === null ? [] : stepsThatSaveNothing({ media, profile });

  const quality: ASetOfChoices | null =
    media === null
      ? null
      : {
          heading: say('common.quality'),
          chosen: chosenQuality,
          choices: [
            {
              id: ADAPTIVE,
              label: say('common.auto'),
              detail: say('phone.watching.theChoicesOn.movesWithYourConnection'),
            },
            {
              id: AS_SENT,
              label: originalLabel(media),
              detail: say('phone.watching.theChoicesOn.asItIsOnTheServer'),
            },
            ...rungs.flatMap((rung) => {
              const step = QUALITY_STEPS.find((one) => one.id === rung);

              if (step === undefined) {
                return [];
              }

              const isNoSmaller = savingNothing.includes(rung);
              const detail = qualityStepDetail({ cost: costs[rung], isNoSmaller });

              return [
                {
                  id: rung,
                  label: step.label,
                  ...(detail === undefined ? {} : { detail }),
                  ...(isNoSmaller ? { isDisabled: true } : {}),
                },
              ];
            }),
          ],
          onChoose: (id) => {
            onQuality(QualityPreferenceSchema.parse(id));
          },
        };

  return { subtitles: subtitleSet, audio, quality, captions };
};

export type { ThePlayersChoices, WhatThereIsToChoose };

export { theChoicesOn };
