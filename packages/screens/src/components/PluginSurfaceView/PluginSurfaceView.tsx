import { useRef, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Spinner } from '@ValenceUI/Spinner';
import { usePluginSurface } from '@ValenceClient/plugins/usePluginSurface';
import { PluginSurface } from '@ValenceScreens/components/PluginSurface/PluginSurface';
import type { PluginSurfaceViewProps } from './PluginSurfaceView.types';
import { say } from '@ValenceI18n/say';

/**
 * A plugin's page or panel on the web, read from the server and kept current as somebody uses it,
 * through the same hook the phone and the television use. A press the plugin asked to have confirmed
 * is confirmed in Valence's own dialog; an address the server answers with, such as where to connect
 * an account, is opened in this window, or by the desktop app in somebody's browser, and it is only
 * ever an address on this server. A plugin that
 * cannot draw, or a press that did not work, is said in Valence's words.
 *
 * @param place - Which page or panel.
 * @param className - Extra classes for the caller's own layout.
 */
const PluginSurfaceView = ({ place, className }: PluginSurfaceViewProps) => {
  const [question, setQuestion] = useState<string | null>(null);
  const answerRef = useRef<((isSure: boolean) => void) | null>(null);

  const answer = (isSure: boolean) => {
    answerRef.current?.(isSure);
    answerRef.current = null;
    setQuestion(null);
  };

  const view = usePluginSurface(place, {
    askToConfirm: (asked) =>
      new Promise<boolean>((resolve) => {
        answerRef.current = resolve;
        setQuestion(asked);
      }),
    openOnServer: (path) => {
      window.location.assign(path);

      return Promise.resolve();
    },
  });

  if (view.isError) {
    return (
      <Callout
        title={say('screens.pluginSurfaceView.thisPluginCouldNotDrawIts')}
        tone="warning"
        action={
          <Button size="sm" variant="secondary" onClick={view.retry}>
            {say('common.tryAgain')}
          </Button>
        }
      >
        {say('screens.pluginSurfaceView.itMayBeTurnedOffOr')}
      </Callout>
    );
  }

  if (view.surface === undefined) {
    return (
      <Spinner size="sm" label={say('screens.pluginSurfaceView.askingThePlugin')} isCentered />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {view.problem === null ? null : <Callout title={view.problem} tone="danger" />}

      <PluginSurface
        pluginId={place.pluginId}
        surface={view.surface}
        isActing={view.isActing}
        onAct={view.act}
        {...(className === undefined ? {} : { className })}
      />

      <ConfirmDialog
        title={say('common.areYouSure')}
        detail={question ?? ''}
        confirmLabel={say('common.continue')}
        isOpen={question !== null}
        onClose={() => {
          answer(false);
        }}
        onConfirm={() => {
          answer(true);
        }}
      />
    </div>
  );
};

PluginSurfaceView.displayName = 'PluginSurfaceView';

export { PluginSurfaceView };
