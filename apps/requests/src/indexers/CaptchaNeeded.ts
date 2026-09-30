import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { saying } from '@ValenceI18n/saying';

class CaptchaNeeded extends IndexerFailure {
  public readonly image: string;

  public constructor(image: string) {
    super(saying('requests.indexers.captchaNeeded.typeTheCharactersInThePicture'));
    this.name = 'CaptchaNeeded';
    this.image = image;
  }
}

export { CaptchaNeeded };
