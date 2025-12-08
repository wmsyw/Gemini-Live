import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Mic, History, Settings } from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [value, setValue] = React.useState(0);
  
  React.useEffect(() => {
    if (location.pathname === '/') setValue(0);
    else if (location.pathname === '/history') setValue(1);
    else if (location.pathname === '/settings') setValue(2);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', bgcolor: 'background.default', pt: 'env(safe-area-inset-top)', pb: 'env(safe-area-inset-bottom)', pl: 'env(safe-area-inset-left)', pr: 'env(safe-area-inset-right)' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderRadius: 0, pt: 'env(safe-area-inset-top)', bgcolor: 'background.default' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'text.primary' }}>
            Gemini Live
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2, pb: 'calc(44px + env(safe-area-inset-bottom))' }}>
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
          sx={{ bgcolor: 'background.default', height: 44 }}
        >
          <BottomNavigationAction label="对话" icon={<Mic size={18} />} />
          <BottomNavigationAction label="历史" icon={<History size={18} />} />
          <BottomNavigationAction label="设置" icon={<Settings size={18} />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
