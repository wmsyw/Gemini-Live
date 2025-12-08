import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handler as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
    }
    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', handler);
      } else if (typeof mq.removeListener === 'function') {
        mq.removeListener(handler as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
      }
    };
  }, []);

  const theme = React.useMemo(() => {
    const mode = currentTheme === 'auto' ? systemMode : currentTheme;
    return getTheme(mode);
  }, [currentTheme, systemMode]);

  const router = React.useMemo(() => createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'settings', element: <Settings /> },
        { path: 'history', element: <History /> },
      ]
    }
  ]), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ThemeProvider>
  );
}

export default App;
