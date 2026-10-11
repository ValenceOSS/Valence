import type { ParsedChannel } from './ParsedChannel';

const ATTRIBUTE = /([a-z][a-z0-9-]*)="([^"]*)"/giu;

const STREAM = /^(https?|rtmp|rtsp|udp|rtp):\/\//iu;

/**
 * Reads a line's quoted attributes, such as `tvg-id="bbc1.uk"`, by name in lower case.
 *
 * @param line - The line.
 * @returns Its attributes.
 */
const attributesOf = (line: string): Map<string, string> =>
  new Map(
    [...line.matchAll(ATTRIBUTE)].map((found) => [found[1]?.toLowerCase() ?? '', found[2] ?? '']),
  );

/**
 * The text after an `#EXTINF` line's last comma outside quotes, which is what the channel is called.
 *
 * @param line - The line.
 * @returns The name, or nothing where the line gives none.
 */
const titleOf = (line: string): string | null => {
  let isQuoted = false;
  let comma = -1;

  for (let at = 0; at < line.length; at += 1) {
    if (line[at] === '"') {
      isQuoted = !isQuoted;
    } else if (line[at] === ',' && !isQuoted) {
      comma = at;
    }
  }

  const title = comma === -1 ? '' : line.slice(comma + 1).trim();

  return title === '' ? null : title;
};

/**
 * Reads an M3U playlist into its channels, in the order it lists them, each with whatever it says of
 * the channel's number, group, logo and guide, the address it streams from, and the user agent and
 * referrer a stream insists on being asked with, as `#EXTVLCOPT` lines say. Lines that are not
 * a stream, and entries with no stream after them, are passed over, so a playlist with a few broken
 * lines still gives the rest. An address listed twice, as a placeholder under each heading often is,
 * is kept once, under the first name given it. A playlist of bare addresses with no `#EXTINF` lines names each
 * channel by its position.
 *
 * @param text - The playlist.
 * @returns Its channels, and the guide it names at its top, if any.
 */
const parseM3u = (text: string): { channels: ParsedChannel[]; guideUrl: string | null } => {
  const lines = text.replace(/^﻿/u, '').split(/\r?\n/u);
  const header = lines.find((line) => line.trim().toUpperCase().startsWith('#EXTM3U')) ?? '';
  const headerAttributes = attributesOf(header);
  const guideUrl = headerAttributes.get('url-tvg') ?? headerAttributes.get('x-tvg-url') ?? null;
  const channels: ParsedChannel[] = [];
  let pending: { line: string; group: string | null } | null = null;
  let group: string | null = null;
  let options = new Map<string, string>();

  for (const raw of lines) {
    const line = raw.trim();

    if (line.toUpperCase().startsWith('#EXTINF')) {
      pending = { line, group: null };
      group = null;
      options = new Map();
    } else if (line.toUpperCase().startsWith('#EXTVLCOPT:')) {
      const [name = '', ...value] = line.slice('#EXTVLCOPT:'.length).split('=');

      options.set(name.trim().toLowerCase(), value.join('=').trim());
    } else if (line.toUpperCase().startsWith('#EXTGRP:')) {
      group = line.slice('#EXTGRP:'.length).trim() || null;
    } else if (STREAM.test(line)) {
      const attributes = attributesOf(pending?.line ?? '');
      const name =
        titleOf(pending?.line ?? '') ?? attributes.get('tvg-name') ?? `${channels.length + 1}`;

      channels.push({
        number: attributes.get('tvg-chno') ?? attributes.get('channel-number') ?? null,
        name,
        group: attributes.get('group-title') ?? group ?? null,
        logoUrl: attributes.get('tvg-logo') ?? null,
        guideId: attributes.get('tvg-id') ?? null,
        streamUrl: line,
        userAgent: options.get('http-user-agent') ?? attributes.get('http-user-agent') ?? null,
        referrer:
          options.get('http-referrer') ??
          attributes.get('http-referrer') ??
          attributes.get('http-referer') ??
          null,
      });
      pending = null;
      group = null;
      options = new Map();
    }
  }

  const firstAt = new Map<string, number>();

  channels.forEach((channel, at) => {
    if (!firstAt.has(channel.streamUrl)) {
      firstAt.set(channel.streamUrl, at);
    }
  });

  return {
    channels: channels
      .filter((channel, at) => firstAt.get(channel.streamUrl) === at)
      .map((channel) => ({
        ...channel,
        number: channel.number === '' ? null : channel.number,
        group: channel.group === '' ? null : channel.group,
        logoUrl: channel.logoUrl === '' ? null : channel.logoUrl,
        guideId: channel.guideId === '' ? null : channel.guideId,
      })),
    guideUrl: guideUrl === '' ? null : guideUrl,
  };
};

export { parseM3u };
