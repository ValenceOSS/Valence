import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { PanelCard } from '@ValenceUI/PanelCard';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { announcementQueries } from '@ValenceClient/query/announcementQueries';
import { postAnnouncement } from '@ValenceClient/announcements/postAnnouncement';
import { ANNOUNCEMENT_LIMIT } from '@ValenceContracts/schemas/Announcement';
import type { AnnouncementSeverity } from '@ValenceContracts/schemas/Announcement';
import { say } from '@ValenceI18n/say';

const HOUR_MS = 3_600_000;

const LASTS = {
  forever: null,
  hour: HOUR_MS,
  day: 24 * HOUR_MS,
  week: 7 * 24 * HOUR_MS,
} as const;

type Lasts = keyof typeof LASTS;

/**
 * Whether a choice is one of the lengths an announcement can stay up for.
 *
 * @param id - The choice.
 * @returns Whether it is one.
 */
const isALength = (id: string): id is Lasts => id in LASTS;

/**
 * Whether a choice is one of the severities an announcement can have.
 *
 * @param id - The choice.
 * @returns Whether it is one.
 */
const isASeverity = (id: string): id is AnnouncementSeverity =>
  id === 'info' || id === 'warning' || id === 'critical';

/**
 * Where an administrator puts an announcement up for everybody, over whatever each of them is
 * doing, and takes it down again: what it says, how serious it is and how long it stays up, with
 * the one up now shown above so it can be replaced or withdrawn.
 */
const AnnouncementCard = () => {
  const cache = useQueryClient();
  const current = useQuery(announcementQueries.current());
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState<AnnouncementSeverity>('info');
  const [lasts, setLasts] = useState<Lasts>('forever');
  const [isPosting, setIsPosting] = useState(false);
  const up = current.data ?? null;

  const send = (draft: Parameters<typeof postAnnouncement>[0]) => {
    setIsPosting(true);

    void postAnnouncement(draft).then((done) => {
      setIsPosting(false);

      if (
        tellOutcome(
          draft === null
            ? say('screens.adminArea.announcementCard.announcementTakenDown')
            : say('screens.adminArea.announcementCard.announcementPosted'),
          done ? null : say('screens.adminArea.announcementCard.announcementCouldNotBeChanged'),
        )
      ) {
        setText('');
        void cache.invalidateQueries({ queryKey: announcementQueries.key });
      }
    });
  };

  return (
    <PanelCard
      title={say('screens.announcementBanner.announcement')}
      actions={
        <PanelCardInfo
          label={say('screens.adminArea.statStrip.aboutLabel', {
            label: say('screens.announcementBanner.announcement'),
          })}
          detail={say('screens.adminArea.announcementCard.shownOverEveryPage')}
        />
      }
      isFlush
    >
      <SettingList isInset>
        {up === null ? null : (
          <SettingRow title={say('screens.adminArea.announcementCard.upNow')} description={up.text}>
            <Button
              variant="secondary"
              size="sm"
              disabled={isPosting}
              onClick={() => {
                send(null);
              }}
            >
              {say('screens.adminArea.announcementCard.takeItDown')}
            </Button>
          </SettingRow>
        )}

        <SettingRow
          title={say('screens.adminArea.sessionCard.message')}
          description={say('screens.adminArea.announcementCard.messageDetail')}
        >
          <TextField
            label={say('screens.adminArea.sessionCard.message')}
            isLabelHidden
            value={text}
            placeholder={say('screens.adminArea.announcementCard.serverRestarting')}
            onValueChange={(next) => {
              setText(next.slice(0, ANNOUNCEMENT_LIMIT));
            }}
            size="sm"
            className="w-80 max-w-full"
          />
        </SettingRow>

        <SettingRow title={say('screens.adminArea.addLibraryDialog.type')}>
          <SegmentedRow
            size="sm"
            tone="accent"
            label={say('screens.adminArea.addLibraryDialog.type')}
            items={[
              { id: 'info', label: say('screens.adminArea.announcementCard.news') },
              { id: 'warning', label: say('screens.adminArea.announcementCard.warning') },
              { id: 'critical', label: say('screens.adminArea.announcementCard.urgent') },
            ]}
            value={severity}
            onSelect={(picked) => {
              if (isASeverity(picked)) {
                setSeverity(picked);
              }
            }}
          />
        </SettingRow>

        <SettingRow title={say('screens.adminArea.announcementCard.showsFor')}>
          <SegmentedRow
            size="sm"
            tone="accent"
            label={say('screens.adminArea.announcementCard.showsFor')}
            items={[
              { id: 'forever', label: say('screens.adminArea.announcementCard.untilTakenDown') },
              { id: 'hour', label: say('common.anHour') },
              { id: 'day', label: say('common.aDay') },
              { id: 'week', label: say('common.aWeek') },
            ]}
            value={lasts}
            onSelect={(picked) => {
              if (isALength(picked)) {
                setLasts(picked);
              }
            }}
          />
        </SettingRow>

        <div className="flex justify-end py-4">
          <Button
            variant="confirm"
            size="sm"
            isLoading={isPosting}
            disabled={isPosting || text.trim() === ''}
            onClick={() => {
              const forMs = LASTS[lasts];

              send({
                text: text.trim(),
                severity,
                endsAt: forMs === null ? null : new Date(Date.now() + forMs).toISOString(),
              });
            }}
          >
            {say('screens.adminArea.announcementCard.post')}
          </Button>
        </div>
      </SettingList>
    </PanelCard>
  );
};

AnnouncementCard.displayName = 'AnnouncementCard';

export { AnnouncementCard };
