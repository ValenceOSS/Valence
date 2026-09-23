import { queryOptions } from '@tanstack/react-query';
import { fetchVideoDevices } from '@ValenceClient/video/videoDevices';

const VIDEO = ['video'] as const;

/**
 * Every copy of Valence this profile has open, and what each is watching.
 *
 * @returns The query.
 */
const devices = () => queryOptions({ queryKey: [...VIDEO, 'devices'], queryFn: fetchVideoDevices });

const videoQueries = { key: VIDEO, devices };

export { videoQueries };
