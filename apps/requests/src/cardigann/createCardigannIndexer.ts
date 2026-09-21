import { load } from 'cheerio';
import { applyFilters } from '@ValenceRequests/cardigann/applyFilters';
import { buildMagnet } from '@ValenceRequests/cardigann/buildMagnet';
import { buildSearchRequests } from '@ValenceRequests/cardigann/buildSearchRequests';
import { configVariables } from '@ValenceRequests/cardigann/configVariables';
import { createCategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import { encodeForm } from '@ValenceRequests/cardigann/encodeForm';
import { findInHtml } from '@ValenceRequests/cardigann/findInHtml';
import { queryVariables } from '@ValenceRequests/cardigann/queryVariables';
import { readCookieHeader } from '@ValenceRequests/cardigann/readCookieHeader';
import { readHtmlSelector } from '@ValenceRequests/cardigann/readHtmlSelector';
import { readSearchResults } from '@ValenceRequests/cardigann/readSearchResults';
import { renderTemplate } from '@ValenceRequests/cardigann/renderTemplate';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { Release, ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type {
  CardigannDefinition,
  CardigannErrorBlock,
  CardigannSelectorField,
} from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { FormPair } from '@ValenceRequests/cardigann/encodeForm';
import type { IndexerSettings } from '@ValenceRequests/cardigann/IndexerSettings';
import type { SiteClient, SiteResponse } from '@ValenceRequests/cardigann/createSiteClient';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';
import type { TemplateValue } from '@ValenceRequests/cardigann/TemplateVariables';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';

type CreateCardigannIndexerOptions = {
  definition: CardigannDefinition;
  settings: IndexerSettings;
  siteLink: string;
  session: SiteSession;
  client: SiteClient;
  indexer: { id: string; name: string };
  timeoutSeconds: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * Waits the given time.
 *
 * @param ms - How long.
 */
const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Whether bytes are a torrent file, which is a bencoded dictionary and so starts with `d`.
 *
 * @param bytes - What came back.
 * @returns Whether it is a torrent.
 */
const isTorrent = (bytes: Uint8Array): boolean => bytes[0] === 0x64;

/**
 * Runs one Cardigann definition against its site: logging in the way the definition says, searching,
 * and fetching a release, all within the session given — whose cookies the caller keeps between runs,
 * so that a site is not logged in to for every search.
 *
 * A search logs in first where the session has nothing to go on, and again where the site answers as
 * if logged out — by redirecting, by refusing, or by a page without the definition's logged-in
 * marker. Where logging in does not help, it says the settings are wrong rather than retrying.
 *
 * @param options - The definition, what the indexer was given, the address in use, the session, how
 *   to reach the site, which indexer this is, how long to wait, and the clock.
 * @returns The indexer.
 */
const createCardigannIndexer = ({
  definition,
  settings,
  siteLink,
  session,
  client,
  indexer,
  timeoutSeconds,
  now = Date.now,
  sleep = pause,
}: CreateCardigannIndexerOptions) => {
  const categories = createCategoryMap(definition.caps);
  const delayMs = (definition.requestDelay ?? 0) * 1000;
  let lastAskedAt = 0;
  const config = (): Record<string, TemplateValue> =>
    configVariables(definition, settings, siteLink, now());
  const at = (path: string, base = siteLink) => new URL(path, base).toString();

  const send = async (
    request: SiteRequest,
    followRedirects: boolean,
    referer: string | null = siteLink,
  ): Promise<SiteResponse> => {
    const wait = lastAskedAt + delayMs - now();

    if (delayMs > 0 && wait > 0) {
      await sleep(wait);
    }

    lastAskedAt = now();

    return client.send(request, {
      session,
      encoding: definition.encoding,
      timeoutSeconds,
      followRedirects,
      referer,
    });
  };

  const headersFor = (variables: Record<string, TemplateValue>, block: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(block).map(([name, value]) => [name, renderTemplate(value, variables)]),
    );

  const checkForErrors = (
    response: SiteResponse,
    blocks: readonly CardigannErrorBlock[] | undefined,
  ) => {
    if (response.status === 401) {
      throw new IndexerFailure(
        'The site refused the login. Check the username, password or cookie.',
      );
    }

    const $ = load(response.body);

    for (const block of blocks ?? []) {
      const found = findInHtml($, $.root(), block.selector);

      if (found.length > 0) {
        const message =
          block.message === undefined
            ? found.text()
            : readHtmlSelector(
                $,
                $.root(),
                block.message,
                { variables: config(), encoding: definition.encoding, nowMs: now() },
                false,
              );

        throw new IndexerFailure(
          `The site refused the login: ${(message ?? '').trim() || 'no reason given'}`,
        );
      }
    }
  };

  const needsLogin = (response: SiteResponse): boolean => {
    const { login } = definition;

    if (login === undefined) {
      return false;
    }

    if (response.redirectedTo !== null || response.status >= 400) {
      return true;
    }

    const marker = login.test?.selector;
    const isHtml = response.contentType === null || response.contentType.includes('html');

    return (
      marker !== undefined &&
      isHtml &&
      findInHtml(load(response.body), load(response.body).root(), marker).length === 0
    );
  };

  const landing = async () => {
    const { login } = definition;
    const variables = config();
    const url = at(renderTemplate(login?.path ?? '', variables));

    session.cookies =
      login?.cookies === undefined ? {} : readCookieHeader(login.cookies.join('; '));

    const response = await send(
      {
        url,
        method: 'GET',
        body: null,
        headers: headersFor(
          variables,
          login !== undefined && Object.keys(login.headers).length > 0
            ? login.headers
            : definition.search.headers,
        ),
      },
      true,
    );

    return { url, response, $: load(response.body) };
  };

  const login = async (): Promise<void> => {
    const { login: block } = definition;

    if (block === undefined) {
      return;
    }

    const variables = config();
    const headers = headersFor(
      variables,
      Object.keys(block.headers).length > 0 ? block.headers : definition.search.headers,
    );
    const inputs = Object.entries(block.inputs).map(([key, value]) => ({
      key,
      value: renderTemplate(value, variables),
      isEncoded: false,
    }));
    let response: SiteResponse;

    switch (block.method) {
      case 'cookie': {
        const cookie =
          typeof settings['cookie'] === 'string'
            ? settings['cookie']
            : renderTemplate(block.inputs['cookie'] ?? '', variables);

        session.cookies = readCookieHeader(cookie);

        return;
      }
      case 'post':
      case 'get':
      case 'oneurl': {
        session.cookies =
          block.cookies === undefined ? {} : readCookieHeader(block.cookies.join('; '));

        const path = renderTemplate(block.path, variables);
        const isPost = block.method === 'post';
        const form = encodeForm(inputs, definition.encoding);
        const url =
          block.method === 'oneurl'
            ? at(path + renderTemplate(block.inputs['oneurl'] ?? '', variables))
            : at(isPost || form === '' ? path : `${path}${path.includes('?') ? '&' : '?'}${form}`);

        response = await send(
          { url, method: isPost ? 'POST' : 'GET', body: isPost ? form : null, headers },
          true,
        );
        break;
      }
      case 'form': {
        const page = await landing();
        const form = findInHtml(page.$, page.$.root(), block.form ?? 'form');

        if (form.length === 0) {
          throw new IndexerFailure(
            `The site’s login page has no form matching ${block.form ?? 'form'}`,
          );
        }

        const pairs = new Map<string, string>();

        form.find('input').each((_, element) => {
          const input = page.$(element);
          const name = input.attr('name');
          const type = (input.attr('type') ?? '').toLowerCase();

          if (
            name !== undefined &&
            input.attr('disabled') === undefined &&
            !((type === 'checkbox' || type === 'radio') && input.attr('checked') === undefined)
          ) {
            pairs.set(name, input.attr('value') ?? '');
          }
        });

        for (const { key, value } of inputs) {
          const name = block.selectors ? findInHtml(page.$, page.$.root(), key).attr('name') : key;

          if (name === undefined) {
            throw new IndexerFailure(`The site’s login form has no input matching ${key}`);
          }

          pairs.set(name, value);
        }

        const context = { variables, encoding: definition.encoding, nowMs: now() };

        for (const [name, selector] of Object.entries(block.selectorinputs ?? {})) {
          const value = readHtmlSelector(
            page.$,
            page.$.root(),
            selector,
            context,
            !selector.optional,
          );

          if (value !== null) {
            pairs.set(name, value);
          }
        }

        const query: FormPair[] = [];

        for (const [name, selector] of Object.entries(block.getselectorinputs ?? {})) {
          const value = readHtmlSelector(
            page.$,
            page.$.root(),
            selector,
            context,
            !selector.optional,
          );

          if (value !== null) {
            query.push({ key: name, value, isEncoded: false });
          }
        }

        const answer = typeof settings['CAPTCHA'] === 'string' ? settings['CAPTCHA'].trim() : '';

        if (block.captcha !== undefined && answer !== '') {
          const name = block.selectors
            ? findInHtml(page.$, page.$.root(), block.captcha.input ?? '').attr('name')
            : block.captcha.input;

          pairs.set(name ?? 'captcha', answer);
        }

        const action = block.submitpath ?? form.attr('action') ?? page.url;
        const target = at(action, page.url);
        const queried =
          query.length === 0
            ? target
            : `${target}${target.includes('?') ? '&' : '?'}${encodeForm(query, definition.encoding)}`;
        const fields = [...pairs].map(([key, value]) => ({ key, value, isEncoded: false }));
        const isMultipart = form.attr('enctype') === 'multipart/form-data';
        const boundary = `----valence${now().toString()}`;

        response = await send(
          {
            url: queried,
            method: 'POST',
            body: isMultipart
              ? `${fields.map(({ key, value }) => `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}`).join('\r\n')}\r\n--${boundary}--`
              : encodeForm(fields, definition.encoding),
            headers: isMultipart
              ? { ...headers, 'content-type': `multipart/form-data; boundary=${boundary}` }
              : headers,
          },
          true,
          page.url,
        );
        break;
      }
      default:
        throw new IndexerFailure(
          `The definition logs in with ${block.method}, which Valence cannot do`,
        );
    }

    checkForErrors(response, block.error);

    if (block.test?.path !== undefined) {
      const tested = await send(
        { url: at(renderTemplate(block.test.path, variables)), method: 'GET', body: null, headers },
        false,
      );

      if (needsLogin(tested)) {
        throw new IndexerFailure('Logging in to the site did not work. Check the settings.');
      }
    }
  };

  const hasSession = () => Object.keys(session.cookies).length > 0;

  const search = async (
    asked: ReleaseSearch,
    askedCategories: readonly number[],
  ): Promise<Release[]> => {
    if (definition.login !== undefined && (definition.login.method === 'cookie' || !hasSession())) {
      await login();
    }

    const requests = buildSearchRequests({
      definition,
      variables: { ...config(), ...queryVariables(asked) },
      categories,
      asked: askedCategories,
      siteLink,
      nowMs: now(),
    });
    const releases = new Map<string, Release>();

    for (const request of requests) {
      const follows = request.path.followredirect || definition.followredirect;
      let response = await send(request, follows);

      if (needsLogin(response)) {
        await login();
        response = await send(request, follows);

        if (needsLogin(response)) {
          throw new IndexerFailure(
            'The site still asks to log in after logging in. Check the settings.',
          );
        }
      }

      if (response.redirectedTo !== null && !follows) {
        throw new IndexerFailure(
          `The site sent the search somewhere else: ${response.redirectedTo}`,
        );
      }

      if (response.status >= 400) {
        throw new IndexerFailure(`The site answered ${response.status.toString()}`);
      }

      for (const release of readSearchResults({
        definition,
        request,
        body: response.body,
        categories,
        indexer,
        nowMs: now(),
      })) {
        releases.set(release.id, release);
      }
    }

    return [...releases.values()];
  };

  const captcha = async (): Promise<{ image: string } | null> => {
    const block = definition.login;

    if (block?.method !== 'form' || block.captcha?.selector === undefined) {
      return null;
    }

    const page = await landing();
    const source = findInHtml(page.$, page.$.root(), block.captcha.selector).attr('src');

    if (source === undefined) {
      return null;
    }

    const image = await send(
      { url: at(source, page.url), method: 'GET', body: null, headers: {} },
      true,
      page.url,
    );

    return {
      image: `data:${image.contentType ?? 'image/png'};base64,${Buffer.from(image.bytes).toString('base64')}`,
    };
  };

  const pick = (
    response: SiteResponse,
    field: CardigannSelectorField,
    variables: Record<string, TemplateValue>,
  ): string | null => {
    const $ = load(response.body);
    const found = findInHtml($, $.root(), renderTemplate(field.selector, variables));
    const value = field.attribute === undefined ? found.text() : found.attr(field.attribute);

    return found.length === 0 || value === undefined
      ? null
      : applyFilters(value.trim(), field.filters, {
          variables,
          encoding: definition.encoding,
          nowMs: now(),
        });
  };

  const download = async (link: string): Promise<ReleaseFile> => {
    if (link.startsWith('magnet:')) {
      return { kind: 'magnet', url: link };
    }

    if (definition.login !== undefined && !hasSession()) {
      await login();
    }

    const variables: Record<string, TemplateValue> = { ...config() };
    const address = new URL(link);

    Object.assign(variables, {
      '.DownloadUri.AbsoluteUri': address.toString(),
      '.DownloadUri.AbsolutePath': address.pathname,
      '.DownloadUri.Scheme': address.protocol.replace(':', ''),
      '.DownloadUri.Host': address.hostname,
      '.DownloadUri.Port': address.port,
      '.DownloadUri.PathAndQuery': address.pathname + address.search,
      '.DownloadUri.Query': address.search,
      ...Object.fromEntries(
        [...address.searchParams].map(([key, value]) => [`.DownloadUri.Query.${key}`, value]),
      ),
    });

    const block = definition.download;
    const headers = headersFor(variables, block?.headers ?? definition.search.headers);
    const page = () => send({ url: link, method: 'GET', body: null, headers }, true, null);
    let before: SiteResponse | null = null;

    if (block?.before !== undefined) {
      const path =
        block.before.pathselector === undefined
          ? block.before.path
          : (pick(await page(), block.before.pathselector, variables) ?? '');
      const pairs = Object.entries(block.before.inputs).map(([key, value]) => ({
        key,
        value: renderTemplate(value, variables),
        isEncoded: false,
      }));
      const isPost = block.before.method === 'post';
      const form = encodeForm(pairs, definition.encoding).replaceAll(
        '&',
        block.before.queryseparator,
      );
      const target = at(renderTemplate(path, variables), link);

      before = await send(
        {
          url:
            isPost || form === ''
              ? target
              : `${target}${target.includes('?') ? block.before.queryseparator : '?'}${form}`,
          method: isPost ? 'POST' : 'GET',
          body: isPost ? form : null,
          headers,
        },
        true,
        link,
      );
    }

    if (block?.infohash !== undefined) {
      const source = block.infohash.usebeforeresponse && before !== null ? before : await page();
      const hash = pick(source, block.infohash.hash, variables);
      const title = pick(source, block.infohash.title, variables);

      if (hash === null || title === null) {
        throw new IndexerFailure('The release’s page did not give its info hash');
      }

      return { kind: 'magnet', url: buildMagnet(hash, title) };
    }

    const method = block?.method === 'post' ? 'POST' : 'GET';

    for (const selector of block?.selectors ?? []) {
      const source = selector.usebeforeresponse && before !== null ? before : await page();
      const href = pick(source, selector, variables);

      if (href === null) {
        continue;
      }

      if (href.startsWith('magnet:')) {
        return { kind: 'magnet', url: href };
      }

      const fetched = await send({ url: at(href, link), method, body: null, headers }, true, link);

      if (!definition.testlinktorrent || isTorrent(fetched.bytes)) {
        return { kind: 'torrent', bytes: fetched.bytes };
      }
    }

    if ((block?.selectors ?? []).length > 0) {
      throw new IndexerFailure('None of the definition’s download links gave a torrent');
    }

    const fetched = await send({ url: link, method, body: null, headers }, false, null);

    if (fetched.redirectedTo?.startsWith('magnet:') === true) {
      return { kind: 'magnet', url: fetched.redirectedTo };
    }

    const final =
      fetched.redirectedTo === null
        ? fetched
        : await send({ url: fetched.redirectedTo, method: 'GET', body: null, headers }, true, null);

    if (!isTorrent(final.bytes)) {
      throw new IndexerFailure(
        'The site answered the download with something that is not a torrent',
      );
    }

    return { kind: 'torrent', bytes: final.bytes };
  };

  return { search, login, captcha, download, categories };
};

export { createCardigannIndexer };
