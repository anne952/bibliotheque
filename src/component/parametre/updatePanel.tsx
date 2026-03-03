import React from 'react';

const UpdatePanel: React.FC = () => {
  const [busy, setBusy] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [updaterState, setUpdaterState] = React.useState<UpdaterState | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      if (!window.api?.updater) {
        if (mounted) setReady(true);
        return;
      }

      try {
        const state = await window.api.updater.getState();

        if (!mounted) return;
        setUpdaterState(state);

        unsubscribe = window.api.updater.onStatus((nextState) => {
          if (!mounted) return;
          setUpdaterState(nextState);
        });

        void window.api.updater.check();
      } catch (initError) {
        if (!mounted) return;
        console.warn('Init updater panel failed:', initError);
      } finally {
        if (mounted) setReady(true);
      }
    };

    void init();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const runAction = async (action: 'check' | 'download' | 'install') => {
    if (!window.api?.updater) return;
    try {
      setBusy(true);
      if (action === 'check') {
        await window.api.updater.check();
      } else if (action === 'download') {
        await window.api.updater.download();
      } else {
        await window.api.updater.install();
      }
    } catch (actionError) {
      console.warn('Updater action failed:', actionError);
    } finally {
      setBusy(false);
    }
  };

  const status = updaterState?.status || 'idle';
  const hasNewUpdate = status === 'available' || status === 'downloading' || status === 'downloaded';

  if (!ready || !window.api?.updater || !hasNewUpdate) {
    return null;
  }

  const isDownloading = status === 'downloading';
  const isDownloaded = status === 'downloaded';

  const handleUpdate = async () => {
    if (isDownloading || busy) return;
    if (isDownloaded) {
      await runAction('install');
      return;
    }
    await runAction('download');
  };

  return (
    <section className="update-simple-card">
      <p className="update-simple-text">
        Nouvelle mise à jour {updaterState?.availableVersion ? `(${updaterState.availableVersion})` : ''}
        {isDownloading && typeof updaterState?.progress === 'number' ? ` - ${Math.round(updaterState.progress)}%` : ''}
      </p>
      <button
        type="button"
        className="btn-save"
        onClick={() => void handleUpdate()}
        disabled={busy || isDownloading}
      >
        Mise à jour
      </button>
    </section>
  );
};

export default UpdatePanel;
