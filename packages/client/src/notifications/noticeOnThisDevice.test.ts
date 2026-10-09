import { afterEach, describe, expect, it, vi } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { noticeOnThisDevice } from './noticeOnThisDevice';

const NOTICE = { title: 'A title', body: 'A body' };

afterEach(() => {
  forgetPlatform();
});

describe('noticeOnThisDevice', () => {
  it('puts nothing up where nobody has turned notices on', () => {
    const notifyLocally = vi.fn();

    installPlatform(aFakePlatform({ notifyLocally }));
    noticeOnThisDevice(NOTICE);

    expect(notifyLocally).not.toHaveBeenCalled();
  });

  it('puts the notice up once they are on', () => {
    const notifyLocally = vi.fn();

    installPlatform(aFakePlatform({ notifyLocally }));
    chooseDeviceNotices(true);
    noticeOnThisDevice(NOTICE);

    expect(notifyLocally).toHaveBeenCalledWith(NOTICE);
  });
});
