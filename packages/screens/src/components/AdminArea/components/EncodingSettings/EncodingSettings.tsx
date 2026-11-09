import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import {
  saveHardwareAccel,
  saveKeepsDownloadsForDays,
  savePlaysEpisodesGapless,
  savePreviewQuality,
  saveUsesKeyframeThumbnails,
  saveUsesShortSegments,
} from '@ValenceClient/admin/fetchAdmin';
import { testHardware } from '@ValenceClient/admin/testHardware';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { PreviewQualitySchema } from '@ValenceContracts/schemas/PreviewQuality';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { accelerationOptions } from '@ValenceScreens/components/AdminArea/accelerationOptions';
import { downloadKeepingChoices } from '@ValenceScreens/components/AdminArea/downloadKeepingChoices';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { SettingMenu } from '@ValenceScreens/components/AdminArea/components/SettingMenu/SettingMenu';
import { DevicePlacement } from './components/DevicePlacement/DevicePlacement';
import { HardwareTestResult } from './components/HardwareTestResult/HardwareTestResult';
import { say } from '@ValenceI18n/say';
import type { ReactNode } from 'react';
import type { HardwareTestReport } from '@ValenceContracts/schemas/HardwareTestReport';
import type { EncodingSettingsProps } from './EncodingSettings.types';

const PREVIEW_QUALITY_CHOICES = [
  { id: 'low', label: say('screens.adminArea.settingsPanel.low') },
  { id: 'standard', label: say('screens.adminArea.settingsPanel.standard') },
  { id: 'high', label: say('common.high') },
] as const;

/**
 * How this server converts and streams video, as two cards: the hardware it converts on, with a test
 * that tries it and how streams are spread across graphics devices, and how video is streamed. Every
 * setting saves as it is changed.
 *
 * @param overview - What the server reports about itself.
 * @param devices - The graphics devices streams can be placed on, or null before they are known.
 */
const EncodingSettings = ({ overview, devices }: EncodingSettingsProps) => {
  const cache = useQueryClient();
  const settings = overview?.settings;
  const [isTesting, setIsTesting] = useState(false);
  const [report, setReport] = useState<HardwareTestReport | null>(null);
  const [hasTestFailed, setHasTestFailed] = useState(false);

  const reread = () => {
    void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
  };

  const [accel, changeAccel] = useSavedSetting(settings?.hardwareAccel ?? '', saveHardwareAccel, {
    done: say('screens.adminArea.settingsPanel.hardwareEncodingSaved'),
    failed: say('screens.adminArea.settingsPanel.hardwareEncodingCouldNotBeSaved'),
    onSaved: reread,
  });

  const [shortSegments, changeShortSegments] = useSavedSetting(
    settings?.usesShortSegments ?? true,
    saveUsesShortSegments,
    {
      done: say('screens.adminArea.settingsPanel.segmentLengthSaved'),
      failed: say('screens.adminArea.settingsPanel.theSegmentLengthCouldNotBe'),
      onSaved: reread,
    },
  );

  const [gapless, changeGapless] = useSavedSetting(
    settings?.playsEpisodesGapless ?? true,
    savePlaysEpisodesGapless,
    {
      done: say('screens.adminArea.settingsPanel.gaplessEpisodesSaved'),
      failed: say('screens.adminArea.settingsPanel.gaplessEpisodesCouldNotBeSaved'),
      onSaved: reread,
    },
  );

  const [quality, changeQuality] = useSavedSetting(
    settings?.previewQuality ?? 'high',
    savePreviewQuality,
    {
      done: say('screens.adminArea.settingsPanel.previewQualitySaved'),
      failed: say('screens.adminArea.settingsPanel.previewQualityCouldNotBeSaved'),
      onSaved: reread,
    },
  );

  const [fastThumbnails, changeFastThumbnails] = useSavedSetting(
    settings?.usesKeyframeThumbnails ?? false,
    saveUsesKeyframeThumbnails,
    {
      done: say('screens.adminArea.settingsPanel.fastThumbnailsSaved'),
      failed: say('screens.adminArea.settingsPanel.fastThumbnailsCouldNotBeSaved'),
      onSaved: reread,
    },
  );

  const [keepsFor, changeKeepsFor] = useSavedSetting(
    String(settings?.keepsDownloadsForDays ?? 14),
    (days) => saveKeepsDownloadsForDays(Number(days)),
    {
      done: say('screens.adminArea.settingsPanel.howLongDownloadsAreKeptSaved'),
      failed: say('screens.adminArea.settingsPanel.howLongDownloadsAreKeptCould'),
      onSaved: reread,
    },
  );

  const hasGraphics = (overview?.transcoder.hardwareAccels.length ?? 0) > 0 && accel !== 'none';

  const about = (title: string, detail: string): ReactNode => (
    <PanelCardInfo
      label={say('screens.adminArea.statStrip.aboutLabel', { label: title })}
      detail={detail}
      align="start"
    />
  );

  const switchRow = (
    title: string,
    detail: string,
    description: string,
    isOn: boolean,
    onToggle: () => void,
  ) => (
    <SettingRow title={title} info={about(title, detail)} description={description}>
      <Switch label={title} isLabelHidden isOn={isOn} onToggle={onToggle} />
    </SettingRow>
  );

  return (
    <>
      <PanelCard title={say('screens.adminArea.encodingSettings.hardware')} isFlush>
        <SettingList isInset>
          <SettingRow
            title={say('screens.adminArea.settingsPanel.hardwareAcceleration')}
            info={about(
              say('screens.adminArea.settingsPanel.hardwareAcceleration'),
              say('screens.adminArea.encodingSettings.hardwareAccelerationAbout'),
            )}
            description={say('screens.adminArea.encodingSettings.hardwareAccelerationDetail')}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={isTesting}
              onClick={() => {
                setIsTesting(true);
                setHasTestFailed(false);

                void testHardware(accel).then((found) => {
                  setIsTesting(false);
                  setReport(found);
                  setHasTestFailed(found === null);
                });
              }}
            >
              {isTesting ? say('screens.adminArea.hardwareTest.testing') : say('common.test')}
            </Button>
            <SettingMenu
              label={say('screens.adminArea.settingsPanel.hardwareAcceleration')}
              value={accel}
              options={accelerationOptions}
              fallback={say('common.automatic')}
              onSelect={changeAccel}
            />
          </SettingRow>

          <HardwareTestResult report={report} hasFailed={hasTestFailed} />

          <DevicePlacement
            overview={overview}
            devices={devices}
            onSaved={() => {
              reread();
              void cache.invalidateQueries({
                queryKey: adminQueries.transcodeDevices().queryKey,
              });
            }}
          />
        </SettingList>
      </PanelCard>

      <PanelCard title={say('client.admin.groupPermissions.streaming')} isFlush>
        <SettingList isInset>
          {switchRow(
            say('screens.adminArea.settingsPanel.shortSegments'),
            say('screens.adminArea.encodingSettings.shortSegmentsAbout'),
            say('screens.adminArea.encodingSettings.shortSegmentsDetail'),
            shortSegments,
            () => {
              changeShortSegments(!shortSegments);
            },
          )}

          {switchRow(
            say('screens.adminArea.settingsPanel.gaplessEpisodes'),
            say('screens.adminArea.encodingSettings.gaplessEpisodesAbout'),
            say('screens.adminArea.encodingSettings.gaplessEpisodesDetail'),
            gapless,
            () => {
              changeGapless(!gapless);
            },
          )}

          <SettingRow
            title={say('screens.adminArea.settingsPanel.previewQuality')}
            info={about(
              say('screens.adminArea.settingsPanel.previewQuality'),
              say('screens.adminArea.encodingSettings.previewQualityAbout'),
            )}
            description={say('screens.adminArea.encodingSettings.previewQualityDetail')}
          >
            <SegmentedRow
              label={say('screens.adminArea.settingsPanel.previewQuality')}
              size="sm"
              tone="accent"
              items={PREVIEW_QUALITY_CHOICES}
              value={quality}
              onSelect={(id) => {
                const chosen = PreviewQualitySchema.safeParse(id);

                if (chosen.success) {
                  changeQuality(chosen.data);
                }
              }}
            />
          </SettingRow>

          {hasGraphics &&
            switchRow(
              say('screens.adminArea.settingsPanel.fastThumbnails'),
              say('screens.adminArea.encodingSettings.fastThumbnailsAbout'),
              say('screens.adminArea.encodingSettings.fastThumbnailsDetail'),
              fastThumbnails,
              () => {
                changeFastThumbnails(!fastThumbnails);
              },
            )}

          <SettingRow
            title={say('screens.adminArea.encodingSettings.keepPreparedDownloads')}
            info={about(
              say('screens.adminArea.encodingSettings.keepPreparedDownloads'),
              say('screens.adminArea.encodingSettings.keepPreparedDownloadsAbout'),
            )}
            description={say('screens.adminArea.encodingSettings.keepPreparedDownloadsDetail')}
          >
            <SettingMenu
              label={say('screens.adminArea.encodingSettings.keepPreparedDownloads')}
              value={keepsFor}
              options={downloadKeepingChoices}
              onSelect={changeKeepsFor}
            />
          </SettingRow>
        </SettingList>
      </PanelCard>
    </>
  );
};

EncodingSettings.displayName = 'EncodingSettings';

export { EncodingSettings };
