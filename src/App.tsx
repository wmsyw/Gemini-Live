import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import History from './pages/History';
import { useStore } from './store';
import './i18n';

function App() {
  const { currentTheme, loadSettings, loadHistory } = useStore();
  const [systemMode, setSystemMode] = React.useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  
  useEffect(() => {
    loadSettings();
    loadHistory();
  }, [loadSettings, loadHistory]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setSystemMode(mq.matches ? 'dark' : 'light');
    };
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler as EventListener);
    } else if (typeof (mq as any).addListener === 'function') {
      (mq as any).addListener(handler);
    }
    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', handler as EventListener);
      } else if (typeof (mq as any).removeListener === 'function') {
        (mq as any).removeListener(handler);
      }
    };
  }, []);

  const theme = React.useMemo(() => {
    const mode = currentTheme === 'auto' ? systemMode : currentTheme;
    return getTheme(mode);
  }, [currentTheme, systemMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="settings" element={<Settings />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
