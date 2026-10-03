import type { ArrApp, ArrAppKind } from '@ValenceContracts/schemas/ArrApp';

type ArrAppForm = {
  kind: ArrAppKind;
  name: string;
  url: string;
  apiKey: string;
  remotePath: string;
  localPath: string;
  isEnabled: boolean;
};

const USUAL_ADDRESSES: Readonly<Record<ArrAppKind, string>> = {
  radarr: 'http://radarr:7878',
  sonarr: 'http://sonarr:8989',
  lidarr: 'http://lidarr:8686',
  prowlarr: 'http://prowlarr:9696',
};

/**
 * The form as it opens: a Radarr at its usual address for a new app, or one already connected, whose
 * key is never sent back and so starts empty.
 *
 * @param app - The app being changed, where it is one.
 * @param names - What each kind of app is called.
 * @returns The form.
 */
const arrAppFormFor = (
  app: ArrApp | null,
  names: Readonly<Record<ArrAppKind, string>>,
): ArrAppForm =>
  app === null
    ? {
        kind: 'radarr',
        name: names.radarr,
        url: USUAL_ADDRESSES.radarr,
        apiKey: '',
        remotePath: '',
        localPath: '',
        isEnabled: true,
      }
    : {
        kind: app.kind,
        name: app.name,
        url: app.url,
        apiKey: '',
        remotePath: app.remotePath,
        localPath: app.localPath,
        isEnabled: app.isEnabled,
      };

/**
 * Changes which kind of app the form is for, bringing that kind's name and usual address with it
 * unless somebody has already typed their own.
 *
 * @param form - The form as it stands.
 * @param kind - The kind chosen.
 * @param names - What each kind of app is called.
 * @returns The changes to make.
 */
const choosingArrKind = (
  form: ArrAppForm,
  kind: ArrAppKind,
  names: Readonly<Record<ArrAppKind, string>>,
): Pick<ArrAppForm, 'kind' | 'name' | 'url'> => {
  const isUntouched = (value: string, known: readonly string[]) =>
    value.trim() === '' || known.includes(value.trim());

  return {
    kind,
    name: isUntouched(form.name, Object.values(names)) ? names[kind] : form.name,
    url: isUntouched(form.url, Object.values(USUAL_ADDRESSES)) ? USUAL_ADDRESSES[kind] : form.url,
  };
};

export type { ArrAppForm };

export { USUAL_ADDRESSES, arrAppFormFor, choosingArrKind };
