import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Slider, Paper, Button } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useStore();
  
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
      setApiKey(settings.apiKey);
  }, [settings.apiKey]);
  
  const handleSaveApiKey = async () => {
    const isDev = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV;
    const proxyPort = 27777;
    const apiUrl = isDev ? `http://localhost:${proxyPort}/api/key` : '/api/key';
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
    } catch (e) {
      console.error('Failed to set API key on server', e);
    }
    const wsUrl = isDev ? `ws://localhost:${proxyPort}/live` : (window.location.protocol === 'https:' ? `wss://${window.location.host}/live` : `ws://${window.location.host}/live`);
    updateSettings({ apiKey, baseUrl: wsUrl });
  };
  
  const handleThemeChange = (event: SelectChangeEvent) => {
    updateSettings({ theme: event.target.value as 'light' | 'dark' | 'auto' });
  };
  
  const handleLanguageChange = (event: SelectChangeEvent) => {
    const lang = event.target.value as 'zh-CN' | 'en-US';
    updateSettings({ language: lang });
    i18n.changeLanguage(lang);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>{t('common.settings')}</Typography>
      
      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
        <Typography variant="h6" gutterBottom fontWeight="bold">API 配置</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          需要 Gemini API Key 才能使用实时语音功能。
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            label={t('settings.apiKey')}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('settings.apiKeyPlaceholder')}
            size="small"
          />
          <Button variant="contained" onClick={handleSaveApiKey} sx={{ minWidth: 100 }}>
            {t('common.save')}
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
        <Typography variant="h6" gutterBottom fontWeight="bold">界面设置</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('settings.theme')}</InputLabel>
            <Select
              value={settings.theme}
              label={t('settings.theme')}
              onChange={handleThemeChange}
            >
              <MenuItem value="light">浅色</MenuItem>
              <MenuItem value="dark">深色</MenuItem>
              <MenuItem value="auto">跟随系统</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small">
            <InputLabel>{t('settings.language')}</InputLabel>
            <Select
              value={settings.language}
              label={t('settings.language')}
              onChange={handleLanguageChange}
            >
              <MenuItem value="zh-CN">中文</MenuItem>
              <MenuItem value="en-US">English</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
        <Typography variant="h6" gutterBottom fontWeight="bold">{t('settings.audio')}</Typography>
        <Box sx={{ px: 1 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>{t('settings.voice')}</InputLabel>
            <Select
              value={settings.voiceStyle || 'Aoede'}
              label={t('settings.voice')}
              onChange={(e) => updateSettings({ voiceStyle: e.target.value as typeof settings.voiceStyle })}
            >
              <MenuItem value="Aoede">Aoede</MenuItem>
              <MenuItem value="Puck">Puck</MenuItem>
              <MenuItem value="Charon">Charon</MenuItem>
              <MenuItem value="Fenrir">Fenrir</MenuItem>
              <MenuItem value="Kore">Kore</MenuItem>
            </Select>
          </FormControl>
          <Typography gutterBottom variant="body2">{t('settings.inputGain')}</Typography>
          <Slider
            value={settings.audioSettings.inputGain}
            min={0}
            max={5}
            step={0.1}
            valueLabelDisplay="auto"
            onChange={(_, value) => updateSettings({ 
                audioSettings: { ...settings.audioSettings, inputGain: value as number } 
            })}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <FormControlLabel
                control={
                <Switch
                    checked={settings.audioSettings.noiseSuppression}
                    onChange={(e) => updateSettings({
                        audioSettings: { ...settings.audioSettings, noiseSuppression: e.target.checked }
                    })}
                />
                }
                label="降噪"
            />
            
            <FormControlLabel
                control={
                <Switch
                    checked={settings.audioSettings.echoCancellation}
                    onChange={(e) => updateSettings({
                        audioSettings: { ...settings.audioSettings, echoCancellation: e.target.checked }
                    })}
                />
                }
                label="回声消除"
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
