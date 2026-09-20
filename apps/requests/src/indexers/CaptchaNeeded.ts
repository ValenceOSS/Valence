import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';

class CaptchaNeeded extends IndexerFailure {
  public readonly image: string;

  public constructor(image: string) {
    super('Type the characters in the picture to log in');
    this.name = 'CaptchaNeeded';
    this.image = image;
  }
}

export { CaptchaNeeded };
