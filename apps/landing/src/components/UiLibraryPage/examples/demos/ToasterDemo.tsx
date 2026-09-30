import { Button } from '@ValenceUI/Button';
import { Toaster } from '@ValenceUI/Toaster';
import { notify } from '@ValenceUI/notify';

const WHERE = 'ui-library';

/**
 * A toaster of its own with buttons that raise each kind of notice, so what the app says when
 * something works, fails or can be undone can be seen as it arrives.
 */
const ToasterDemo = () => (
  <div className="flex flex-wrap gap-3">
    <Toaster id={WHERE} position="bottom-right" />

    <Button
      variant="secondary"
      onClick={() => {
        notify.worked('Library added', { where: WHERE, description: 'Films is being read now.' });
      }}
    >
      Success
    </Button>

    <Button
      variant="secondary"
      onClick={() => {
        notify.failed('Could not reach the server', { where: WHERE });
      }}
    >
      Error
    </Button>

    <Button
      variant="secondary"
      onClick={() => {
        notify.say('Removed from your list', {
          where: WHERE,
          action: { label: 'Undo', onPress: () => undefined },
        });
      }}
    >
      With an action
    </Button>
  </div>
);

ToasterDemo.displayName = 'ToasterDemo';

export { ToasterDemo };
