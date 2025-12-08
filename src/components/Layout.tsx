import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Mic, History, Settings } from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [value, setValue] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);
  
  React.useEffect(() => {
    if (location.pathname === '/') setValue(0);
    else if (location.pathname === '/history') setValue(1);
    else if (location.pathname === '/settings') setValue(2);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', bgcolor: 'background.default', pt: 'env(safe-area-inset-top)', pb: 'env(safe-area-inset-bottom)', pl: 'env(safe-area-inset-left)', pr: 'env(safe-area-inset-right)' }}
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={(e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        if (touchStartX.current != null && touchEndX.current != null) {
          const dx = touchEndX.current - touchStartX.current;
          if (Math.abs(dx) > 60) {
            if (dx > 0 && value > 0) setValue(value - 1);
            if (dx < 0 && value < 2) setValue(value + 1);
            const next = dx > 0 ? value - 1 : value + 1;
            if (next === 0) navigate('/');
            else if (next === 1) navigate('/history');
            else if (next === 2) navigate('/settings');
          }
        }
        touchStartX.current = null;
        touchEndX.current = null;
      }}
    >
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderRadius: 0, pt: 'env(safe-area-inset-top)', bgcolor: 'background.default' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'text.primary' }}>
            Gemini Live
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2, pb: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </Container>
      
      <Paper square sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, pb: 'env(safe-area-inset-bottom)', borderRadius: 0, bgcolor: 'background.default' }} elevation={0}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            if (newValue === 0) navigate('/');
            else if (newValue === 1) navigate('/history');
            else if (newValue === 2) navigate('/settings');
          }}
          sx={{ bgcolor: 'background.default' }}
        >
          <BottomNavigationAction label="对话" icon={<Mic size={24} />} />
          <BottomNavigationAction label="历史" icon={<History size={24} />} />
          <BottomNavigationAction label="设置" icon={<Settings size={24} />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
