import { LAYOUT_COOKIE } from '@ValenceCore/functions/LAYOUT_COOKIE';
import { LAYOUT_COOKIE_SECONDS } from '@ValenceCore/functions/LAYOUT_COOKIE_SECONDS';
import { LAYOUT_KEPT_COOKIE } from '@ValenceCore/functions/LAYOUT_KEPT_COOKIE';
import { LAYOUT_ON_TRIAL_COOKIE } from '@ValenceCore/functions/LAYOUT_ON_TRIAL_COOKIE';

const WAITS_MILLISECONDS = 10_000;

const KEPT_FOR = `path=/; max-age=${LAYOUT_COOKIE_SECONDS.toString()}; samesite=lax`;

// oxlint-disable-next-line valence/no-hard-coded-strings -- a script the browser runs, not words a person reads
const WAY_BACK = `<script>(function () {
  function goBack() {
    document.cookie = '${LAYOUT_ON_TRIAL_COOKIE}=; path=/; max-age=0; samesite=lax';
    document.cookie = '${LAYOUT_COOKIE}=tv; ${KEPT_FOR}';
    location.replace(location.pathname + '?layout=tv');
  }
  var timer = setTimeout(goBack, ${WAITS_MILLISECONDS.toString()});
  window.valenceLayoutTrial = {
    endsAt: new Date().getTime() + ${WAITS_MILLISECONDS.toString()},
    keep: function () {
      clearTimeout(timer);
      document.cookie = '${LAYOUT_ON_TRIAL_COOKIE}=; path=/; max-age=0; samesite=lax';
      document.cookie = '${LAYOUT_KEPT_COOKIE}=1; ${KEPT_FOR}';
      window.valenceLayoutTrial = undefined;
    },
    goBack: function () {
      clearTimeout(timer);
      goBack();
    }
  };
})();</script>`;

/**
 * Gives the web app's page, as a television's browser is sent it after somebody chose it there, a
 * way back to the TV layout that does not need the web app to run.
 *
 * Some televisions pass every check for running the web app and still draw nothing but a white
 * page, or draw it but leave the remote nothing it can reach, with no way to choose the TV layout
 * again and no address bar a remote can reach. So the layout is on trial: a few lines of the oldest
 * script there is go back to the TV layout after ten seconds unless the web app, once it is drawn,
 * is told to keep it, which it asks the viewer as a countdown. The page is loaded asking for the TV
 * layout rather than reloaded as it was, since an address that asked for the web app would only ask
 * again.
 *
 * @param page - The web app's page.
 * @returns The page with the way back in it.
 */
const withAWayBackToTheTvLayout = (page: string): string =>
  page.includes('</body>') ? page.replace('</body>', `${WAY_BACK}</body>`) : `${page}${WAY_BACK}`;

export { withAWayBackToTheTvLayout };
