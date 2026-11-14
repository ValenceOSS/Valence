import { describe, expect, it } from 'vitest';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { startBodyWithin } from './startBodyWithin';

const bytes = (text: string) => new TextEncoder().encode(text).buffer;

const read = (body: ArrayBuffer | null) =>
  body === null ? null : JsonValueSchema.parse(JSON.parse(new TextDecoder().decode(body)));

describe('startBodyWithin', () => {
  it('holds what was asked for to the ceiling, keeping the rest', () => {
    expect(
      read(startBodyWithin(bytes('{"requestedQuality":"2160p","startSeconds":30}'), '720p')),
    ).toEqual({ requestedQuality: '720p', startSeconds: 30 });
  });

  it('holds a request that names no quality to the ceiling too', () => {
    expect(read(startBodyWithin(bytes('{}'), '1080p'))).toEqual({ requestedQuality: '1080p' });
  });

  it('holds a quality this server does not know to the ceiling', () => {
    expect(read(startBodyWithin(bytes('{"requestedQuality":"8k","x":1}'), '720p'))).toEqual({
      requestedQuality: '720p',
      x: 1,
    });
  });

  it('refuses a request it cannot read, rather than passing it on as sent', () => {
    expect(startBodyWithin(bytes('{"requestedQuality":"2160p","x":1e999}'), '720p')).toBeNull();
    expect(startBodyWithin(bytes('not json'), '720p')).toBeNull();
    expect(startBodyWithin(bytes('[]'), '720p')).toBeNull();
    expect(startBodyWithin(null, '720p')).toBeNull();
  });
});
