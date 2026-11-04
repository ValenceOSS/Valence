import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import {
  removeSplashscreen,
  saveAllowedApps,
  saveShowsProfilesBeforeSignIn,
  saveSplashscreen,
  saveWayInMessage,
} from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { EVERY_APP_ALLOWED } from '@ValenceContracts/schemas/AllowedApps';
import { VALENCE_ACCENT } from '@ValenceContracts/schemas/Brand';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { say } from '@ValenceI18n/say';
import type { AllowedApps } from '@ValenceContracts/schemas/AllowedApps';
import type { SignInCardProps } from './SignInCard.types';

const SPLASHSCREEN_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

const TYPING_SETTLES_MS = 700;

const APPS = [
  { id: 'web', label: say('screens.adminArea.settingsPanel.theWeb'), isLocked: true },
  { id: 'desktop', label: say('screens.adminArea.signInCard.desktop') },
  { id: 'phone', label: say('phone.platform.describeThisPhone.aPhone') },
  { id: 'tv', label: say('screens.adminArea.signInCard.tv') },
];

/**
 * Says which apps are allowed as the ids the apps field lists, the web always among them.
 *
 * @param allowed - Which apps people may sign in with.
 * @returns The ids chosen.
 */
const chosenOf = (allowed: AllowedApps): string[] => [
  'web',
  ...(allowed.desktop ? ['desktop'] : []),
  ...(allowed.phone ? ['phone'] : []),
  ...(allowed.tv ? ['tv'] : []),
];

/**
 * The screen people sign in from: whether it lists everyone's profile, the picture behind it, a
 * message under "Who's watching?", which apps may sign in at all, and a warning where sign-in is
 * not over HTTPS. Each saves as it is changed.
 *
 * @param overview - What the server reports about itself.
 */
const SignInCard = ({ overview }: SignInCardProps) => {
  const cache = useQueryClient();
  const settings = overview?.settings;
  const [splashscreen, setSplashscreen] = useState<{ was: string | null; now: string | null }>({
    was: settings?.splashscreen ?? null,
    now: settings?.splashscreen ?? null,
  });
  const [problem, setProblem] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const picture =
    splashscreen.was === (settings?.splashscreen ?? null)
      ? splashscreen.now
      : (settings?.splashscreen ?? null);

  const reread = () => {
    void cache.invalidateQueries({ queryKey: adminQueries.overview().queryKey });
    void cache.invalidateQueries({ queryKey: sessionQueries.wayIn().queryKey });
  };

  const [showsFaces, changeShowsFaces] = useSavedSetting(
    settings?.showsProfilesBeforeSignIn ?? true,
    saveShowsProfilesBeforeSignIn,
    {
      done: say('screens.adminArea.settingsPanel.signInScreenSaved'),
      failed: say('screens.adminArea.settingsPanel.theSignInScreenCouldNot'),
      onSaved: reread,
    },
  );

  const [message, changeMessage] = useSavedSetting(
    {
      text: settings?.wayInMessage?.text ?? '',
      colour: settings?.wayInMessage?.colour ?? null,
    },
    (next) =>
      saveWayInMessage(next.text.trim() === '' ? null : { ...next, text: next.text.trim() }),
    {
      done: say('screens.adminArea.wayInMessageRow.messageSaved'),
      failed: say('screens.adminArea.wayInMessageRow.messageCouldNotBeSaved'),
      delayMs: TYPING_SETTLES_MS,
      onSaved: reread,
    },
  );

  const [apps, changeApps] = useSavedSetting(
    settings?.allowedApps ?? EVERY_APP_ALLOWED,
    saveAllowedApps,
    {
      done: say('screens.adminArea.settingsPanel.appsSaved'),
      failed: say('screens.adminArea.settingsPanel.theAppsCouldNotBeSaved'),
      onSaved: reread,
    },
  );

  const choosePicture = (file: File) => {
    setIsChanging(true);
    setProblem(null);

    void saveSplashscreen(file).then((answer) => {
      setIsChanging(false);

      if ('problem' in answer) {
        setProblem(answer.problem);
        tellOutcome('', answer.problem);

        return;
      }

      tellOutcome(say('screens.adminArea.settingsPanel.splashscreenSaved'), null);
      setSplashscreen({ was: settings?.splashscreen ?? null, now: answer.splashscreen });
      reread();
    });
  };

  const removePicture = () => {
    setIsChanging(true);
    setProblem(null);

    void removeSplashscreen().then((removed) => {
      setIsChanging(false);
      tellOutcome(
        say('screens.adminArea.settingsPanel.splashscreenRemoved'),
        removed ? null : say('screens.adminArea.settingsPanel.theSplashscreenCouldNotBeRemoved'),
      );

      if (removed) {
        setSplashscreen({ was: settings?.splashscreen ?? null, now: null });
        reread();

        return;
      }

      setProblem(say('screens.adminArea.settingsPanel.thePictureCouldNotBeRemoved'));
    });
  };

  return (
    <PanelCard title={say('screens.adminArea.signInCard.signInScreen')} isFlush>
      <SettingList isInset>
        <SettingRow
          title={say('screens.adminArea.signInCard.showProfiles')}
          info={
            <PanelCardInfo
              label={say('screens.adminArea.statStrip.aboutLabel', {
                label: say('screens.adminArea.signInCard.showProfiles'),
              })}
              detail={say('screens.adminArea.signInCard.showProfilesAbout')}
              align="start"
            />
          }
          description={say('screens.adminArea.signInCard.showProfilesDetail')}
        >
          <Switch
            label={say('screens.adminArea.signInCard.showProfiles')}
            isLabelHidden
            isOn={showsFaces}
            onToggle={() => {
              changeShowsFaces(!showsFaces);
            }}
          />
        </SettingRow>

        <SettingRow
          title={say('common.background')}
          description={
            problem === null ? (
              say('screens.adminArea.signInCard.backgroundDetail')
            ) : (
              <span role="alert" className="text-danger">
                {problem}
              </span>
            )
          }
        >
          {picture === null ? null : (
            <img src={picture} alt="" className="h-9 w-16 rounded-md object-cover" />
          )}
          {picture === null ? null : (
            <Button variant="ghost" size="sm" disabled={isChanging} onClick={removePicture}>
              {say('common.forget')}
            </Button>
          )}
          <FilePicker
            label={say('common.choose')}
            accept={SPLASHSCREEN_TYPES}
            variant="secondary"
            size="sm"
            isLoading={isChanging}
            onPick={choosePicture}
          >
            <Icon of={ImageIcon} size={15} />
            {picture === null ? say('common.choose') : say('common.replace')}
          </FilePicker>
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.sessionCard.message')}
          description={say('screens.adminArea.signInCard.messageDetail')}
        >
          <ColourChoice
            label={say('screens.adminArea.signInCard.messageColour')}
            value={message.colour ?? VALENCE_ACCENT}
            isCompact
            onChange={(colour) => {
              changeMessage({ ...message, colour });
            }}
          />
          <TextField
            label={say('screens.adminArea.sessionCard.message')}
            isLabelHidden
            size="sm"
            value={message.text}
            placeholder={say('screens.adminArea.signInCard.welcomeHome')}
            onValueChange={(text) => {
              changeMessage({ ...message, text });
            }}
            className="w-56 max-w-full"
          />
        </SettingRow>

        <SettingRow
          title={say('screens.adminArea.signInCard.apps')}
          info={
            <PanelCardInfo
              label={say('screens.adminArea.statStrip.aboutLabel', {
                label: say('screens.adminArea.signInCard.apps'),
              })}
              detail={say('screens.adminArea.signInCard.appsAbout')}
              align="start"
            />
          }
          description={say('screens.adminArea.signInCard.appsDetail')}
        >
          <MultiSelectField
            label={say('screens.adminArea.signInCard.apps')}
            isLabelHidden
            placeholder={say('screens.adminArea.settingsPanel.theWeb')}
            className="w-56"
            options={APPS}
            value={chosenOf(apps)}
            onChange={(chosen) => {
              changeApps({
                desktop: chosen.includes('desktop'),
                phone: chosen.includes('phone'),
                tv: chosen.includes('tv'),
              });
            }}
          />
        </SettingRow>

        {settings?.cookieSecure === false ? (
          <div className="py-4">
            <Callout
              tone="warning"
              icon={TriangleAlertIcon}
              title={say('screens.adminArea.signInCard.signInIsNotOverHttps')}
            >
              {say('screens.adminArea.signInCard.signInIsNotOverHttpsDetail', {
                addresses: settings.trustedOrigins.join(', '),
              })}
            </Callout>
          </div>
        ) : null}
      </SettingList>
    </PanelCard>
  );
};

SignInCard.displayName = 'SignInCard';

export { SignInCard };
