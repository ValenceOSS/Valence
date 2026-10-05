import { say } from '@ValenceI18n/say';

class RequestFailed extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
    readonly isUnknownToServer = false,
  ) {
    super(
      isUnknownToServer
        ? say('client.query.thisAppIsNewerThanTheServer')
        : `${path} answered ${status.toString()}`,
    );
    this.name = 'RequestFailed';
  }
}

export { RequestFailed };
