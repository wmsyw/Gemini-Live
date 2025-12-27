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
        message="发现新版本,请刷新以体验最新功能"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 'calc(64px + env(safe-area-inset-bottom, 0px))', zIndex: 2000 }}
        action={
          <React.Fragment>
            <Button color="primary" size="small" onClick={() => updateServiceWorker(true)}>
              立即刷新
            </Button>
            <IconButton size="small" aria-label="close" color="inherit" onClick={close}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
    </>
  );
};

export default ReloadPrompt;
