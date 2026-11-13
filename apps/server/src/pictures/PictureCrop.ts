import type { Crop } from './Crop';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type PictureCrop = { crop: Crop; frame: PhotoFrame | null };

export type { PictureCrop };
