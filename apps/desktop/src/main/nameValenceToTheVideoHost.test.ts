import { describe, expect, it } from 'vitest';
import { isAVideoHost, nameValenceToTheVideoHost } from './nameValenceToTheVideoHost';

describe('knowing a request is going to the video host', () => {
  it('knows the host a trailer is framed from, with or without the www', () => {
    expect(isAVideoHost('https://www.youtube-nocookie.com/embed/abc')).toBe(true);
    expect(isAVideoHost('https://youtube-nocookie.com/embed/abc')).toBe(true);
    expect(isAVideoHost('https://www.youtube.com/iframe_api')).toBe(true);
  });

  it('leaves everything else alone, the viewer’s own server included', () => {
    expect(isAVideoHost('wss://films.example.com/api/live')).toBe(false);
    expect(isAVideoHost('https://notyoutube.com/embed/abc')).toBe(false);
    expect(isAVideoHost('https://youtube.com.example.com/embed/abc')).toBe(false);
  });

  it('is not fooled by something that will not parse as an address', () => {
    expect(isAVideoHost('not an address')).toBe(false);
  });
});

describe('saying who is framing the trailer', () => {
  it('names Valence, which is what the player is actually asking', () => {
    const dressed = nameValenceToTheVideoHost({ Accept: '*/*' });

    expect(dressed.Referer).toBe('https://getvalence.app/');
  });

  it('names nothing about the viewer’s own server', () => {
    const dressed = nameValenceToTheVideoHost({ Accept: '*/*' });

    expect(JSON.stringify(dressed)).not.toContain('example.com');
  });

  it('leaves the origin alone, which the picture itself is fetched against', () => {
    expect(nameValenceToTheVideoHost({ Origin: 'https://www.youtube-nocookie.com' }).Origin).toBe(
      'https://www.youtube-nocookie.com',
    );
  });

  it('keeps the headers the request was already carrying', () => {
    expect(nameValenceToTheVideoHost({ Accept: '*/*' }).Accept).toBe('*/*');
  });
});
