import { appUserAgent } from '@ValenceCore/functions/appUserAgent';
import { describeThisPhone } from '@ValenceMobile/platform/describeThisPhone';
import { CLIENT_KIND_HEADER } from '@ValenceContracts/constants/CLIENT_KIND_HEADER';
import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { writeDeviceHints } from '@ValenceContracts/functions/writeDeviceHints';
import { theDeviceHints } from '@ValenceClient/platform/theDeviceHints';

/**
 * Says, on a request to the server this phone watches, where it comes from and what is asking: the
 * server's own address as its origin, this phone by name, that it is a phone, and what it can play.
 *
 * @param headers - The request's headers, which are changed.
 * @param address - The server's address.
 */
const tellThisServerWhoAsks = (headers: Headers, address: string): void => {
  headers.set('origin', address);
  headers.set('user-agent', appUserAgent(describeThisPhone()));
  headers.set(CLIENT_KIND_HEADER, 'phone');
  headers.set(DEVICE_HEADER, writeDeviceHints(theDeviceHints()));
};

export { tellThisServerWhoAsks };
