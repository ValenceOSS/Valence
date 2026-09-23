import { describe, expect, it } from 'vitest';
import { videoQueries } from '@ValenceClient/query/videoQueries';
import { fetchVideoDevices } from '@ValenceClient/video/videoDevices';

describe('videoQueries', () => {
  it('keeps the devices under the video key, so one refresh reaches them', () => {
    expect(videoQueries.devices().queryKey.slice(0, 1)).toEqual([...videoQueries.key]);
  });

  it('reads the devices from the server', () => {
    expect(videoQueries.devices().queryFn).toBe(fetchVideoDevices);
  });
});
