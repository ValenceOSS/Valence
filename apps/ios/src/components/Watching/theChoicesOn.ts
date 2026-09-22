import { describeAudioTrack } from '@ValenceCore/functions/describeTrack';
import { listAvailableQualitySteps } from '@ValenceCore/functions/listAvailableQualitySteps';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { SUBTITLES_OFF } from '@ValenceClient/playback/fetchSubtitles';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import { QualityPreferenceSchema } from '@ValenceClient/playback/qualityPreference';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { ASetOfChoices } from '@ValencePhone/components/Watching/components/TheChoices/TheChoices.types';

const AS_SENT = 'original';

type WhatThereIsToChoose = {
  streams: readonly AudioStream[];
  subtitles: readonly SubtitleTrack[];
  chosenSubtitle: string;
  onSubtitle: (trackId: string) => void;
  media: MediaDetail | null;
  chosenAudio: number | null;
  chosenQuality: QualityPreference;
  onAudio: (streamIndex: number) => void;
  onQuality: (quality: QualityPreference) => void;
};

/**
 * What there is to choose about a particular film on a particular phone.
 *
 * Both answers are given to the server rather than acted on here: a session is one picture with one
 * sound on it, chosen when it starts, so changing either means asking for a new one. That is why
 * neither of these is a switch — a switch implies something that flips, and what happens is the
 * film is fetched again from where they had got to.
 *
 * A set with one thing in it is left out. Offering somebody a choice between one option and nothing
 * is not a choice, and a film with a single soundtrack should not have a menu saying so. Subtitles
 * are the exception, because off is a real answer there and one track plus off is a real choice.
 *
 * @param streams - The soundtracks the file carries.
 * @param subtitles - The subtitle tracks there are to read.
 * @param chosenSubtitle - Which is being read, or off.
 * @param onSubtitle - Told which one they want.
 * @param media - The file itself, which decides what qualities are worth offering.
 * @param chosenAudio - Which soundtrack is playing, or none chosen and the file's own default.
 * @param chosenQuality - What was asked for, or the file as it is.
 * @param onAudio - Told which soundtrack they want.
 * @param onQuality - Told how much of their connection to spend.
 * @returns The sets to show, in the order they should be read.
 */
const theChoicesOn = ({
  streams,
  subtitles,
  chosenSubtitle,
  onSubtitle,
  media,
  chosenAudio,
  chosenQuality,
  onAudio,
  onQuality,
}: WhatThereIsToChoose): ASetOfChoices[] => {
  const sets: ASetOfChoices[] = [];

  if (subtitles.length > 0) {
    sets.push({
      heading: 'Subtitles',
      chosen: chosenSubtitle,
      choices: [
        { id: SUBTITLES_OFF, label: 'Off' },
        ...subtitles.map((track) => ({
          id: track.id,
          label: track.label,
          detail: track.format.toUpperCase(),
        })),
      ],
      onChoose: onSubtitle,
    });
  }

  if (streams.length > 1) {
    sets.push({
      heading: 'Audio',
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
    });
  }

  const rungs = media === null ? [] : listAvailableQualitySteps(media);

  if (rungs.length > 0) {
    sets.push({
      heading: 'Quality',
      chosen: chosenQuality,
      choices: [
        { id: AS_SENT, label: 'Original', detail: 'As it is on the server' },
        ...rungs.flatMap((rung) => {
          const step = QUALITY_STEPS.find((one) => one.id === rung);

          return step === undefined
            ? []
            : [
                {
                  id: rung,
                  label: step.label,
                  detail: `up to ${(step.maxVideoBitrateKbps / 1000).toString()} Mbps`,
                },
              ];
        }),
      ],
      onChoose: (id) => {
        onQuality(QualityPreferenceSchema.parse(id));
      },
    });
  }

  return sets;
};

export type { WhatThereIsToChoose };

export { theChoicesOn };
