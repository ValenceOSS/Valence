import { describe, expect, it } from 'vitest';
import { tvBrowserOf } from '@ValenceCore/functions/tvBrowserOf';

const LG =
  'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 WebAppManager';

const SAMSUNG =
  'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.0 TV Safari/537.36';

const ANOTHER =
  'Mozilla/5.0 (Linux; SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36';

const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

describe('tvBrowserOf', () => {
  it('knows LG’s browser, though it calls itself a smart TV as well', () => {
    expect(tvBrowserOf(LG)).toBe('lgTv');
  });

  it('knows Samsung’s browser', () => {
    expect(tvBrowserOf(SAMSUNG)).toBe('samsungTv');
  });

  it('calls another maker’s television browser a smart TV', () => {
    expect(tvBrowserOf(ANOTHER)).toBe('smartTv');
  });

  it('says nothing of a browser that is not a television’s', () => {
    expect(tvBrowserOf(DESKTOP)).toBeNull();
  });
});
