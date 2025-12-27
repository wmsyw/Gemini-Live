import React from 'react';
import { Snackbar, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered');
      if (r) {
        const interval = setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
        return () => clearInterval(interval);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const hardRefresh = React.useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    window.location.reload();
  }, []);

  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  React.useEffect(() => {
    if (!needRefresh) return;
    updateServiceWorker(true);
    const fallback = window.setTimeout(() => {
      void hardRefresh();
    }, 2000);
    return () => clearTimeout(fallback);
  }, [needRefresh, updateServiceWorker, hardRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      <Snackbar
        open={offlineReady}
        onClose={close}
        autoHideDuration={3000}
        message="应用已准备好离线使用"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      />
      <Snackbar
        open={needRefresh}
        onClose={() => {}}
        message="正在更新到最新版本..."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 'calc(64px + env(safe-area-inset-bottom, 0px))', zIndex: 2000 }}
      />
    </>
  );
};

export default ReloadPrompt;
