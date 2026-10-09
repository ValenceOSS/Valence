import { z } from 'zod';
import type { DownloadedSubtitle } from './DownloadedSubtitle';
import { OPEN_SUBTITLES_AGENT } from './OPEN_SUBTITLES_AGENT';
import { OPEN_SUBTITLES_API } from './OPEN_SUBTITLES_API';

const LoginSchema = z.object({ token: z.string().min(1) });

const DownloadSchema = z.object({ link: z.string().url() });

type OpenSubtitlesAccount = { key: string; username: string; password: string };

/**
 * Downloads one subtitle file from OpenSubtitles, signing in first where an account is given, since
 * each account has its own allowance of downloads a day and one without an account has a smaller
 * one shared by every server on the address.
 *
 * @param account - The API key, and the account to sign in as where there is one.
 * @param fileId - The subtitle file OpenSubtitles listed.
 * @param fetchImpl - The way out to the web.
 * @returns The subtitle as it was written, or nothing where it could not be had — the day's allowance used
 *   up, a sign-in refused, or the site not answering.
 */
const fetchOpenSubtitle = async (
  account: OpenSubtitlesAccount,
  fileId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DownloadedSubtitle | null> => {
  const headers: Record<string, string> = {
    'Api-Key': account.key,
    'User-Agent': OPEN_SUBTITLES_AGENT,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (account.username !== '' && account.password !== '') {
    const signedIn = await fetchImpl(`${OPEN_SUBTITLES_API}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: account.username, password: account.password }),
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    const login = LoginSchema.safeParse(await signedIn?.json().catch(() => null));

    if (login.success) {
      // oxlint-disable-next-line valence/no-hard-coded-strings -- an HTTP authorisation scheme, not words anyone reads
      headers.Authorization = `Bearer ${login.data.token}`;
    }
  }

  const asked = await fetchImpl(`${OPEN_SUBTITLES_API}/download`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ file_id: Number(fileId) }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const download = DownloadSchema.safeParse(await asked?.json().catch(() => null));

  if (asked?.ok !== true || !download.success) {
    return null;
  }

  const file = await fetchImpl(download.data.link, { signal: AbortSignal.timeout(30_000) }).catch(
    () => null,
  );

  return file?.ok === true
    ? { kind: 'downloaded', bytes: new Uint8Array(await file.arrayBuffer()), extension: 'srt' }
    : null;
};

export type { OpenSubtitlesAccount };

export { fetchOpenSubtitle };
