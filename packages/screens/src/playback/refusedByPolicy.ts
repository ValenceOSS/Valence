const refused = new Set<string>();

const listening = { isOn: false };

/**
 * The origins this page's Content-Security-Policy has refused a request to, as the browser reports
 * each refusal. Starts listening on the first call and keeps listening while the page is open, so
 * call it before anything is fetched from another server.
 *
 * @returns The refused origins.
 */
const refusedByPolicy = (): ReadonlySet<string> => {
  if (!listening.isOn && typeof document !== 'undefined') {
    listening.isOn = true;
    document.addEventListener('securitypolicyviolation', (event) => {
      if (URL.canParse(event.blockedURI)) {
        refused.add(new URL(event.blockedURI).origin);
      }
    });
  }

  return refused;
};

export { refusedByPolicy };
