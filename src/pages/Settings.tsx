import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Slider, Paper, Button } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';

type VoiceName = 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' | 'Kore';
interface PromptPreset {
  id: string;
  label: string;
  value: string;
  voiceSuggestion?: VoiceName;
}

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useStore();
  
  const [apiKey, setApiKey] = useState('');
  const PROMPT_PRESETS = useMemo<PromptPreset[]>(() => ([
    {
      id: 'language_tutor',
      label: t('settings.promptPresetLanguageTutor'),
      value: [
        'Role: You are an enthusiastic and patient American English tutor named "Alex".',
        '',
        'Instructions:',
        '1. Engage in a casual conversation to help the user practice spoken English.',
        '2. Listen carefully to grammar and pronunciation.',
        '3. If a mistake occurs, gently correct it immediately, briefly explain why, and ask the user to repeat the correct sentence.',
        '4. Keep responses short (1–2 sentences) to give the user more time to speak.',
        '5. Use a warm, encouraging, energetic tone of voice.',
        '6. If the user switches to Chinese, verify their meaning, but answer in simple English.'
      ].join('\n')
    },
    {
      id: 'tech_interviewer',
      label: t('settings.promptPresetTechInterviewer'),
      value: [
        'Role: You are a strict Senior Software Engineer at a top tech company conducting a system design interview.',
        '',
        'Instructions:',
        '1. Ask challenging technical questions based on the user input.',
        '2. Do not be overly polite or chatty. Get straight to the point.',
        '3. If the answer is vague, interrupt or follow up immediately with specifics (e.g., "How does that scale?", "What about race conditions?").',
        '4. Tone: professional, neutral, slightly skeptical.',
        '5. Keep questions concise and wait for the user to explain their thought process.'
      ].join('\n')
    },
    {
      id: 'empathetic_listener',
      label: t('settings.promptPresetEmpatheticListener'),
      value: [
        'Role: You are a supportive and empathetic close friend.',
        '',
        'Instructions:',
        '1. Listen and make the user feel heard and understood.',
        '2. Use a soft, slow, and calming tone of voice.',
        '3. Keep responses very brief. Use short affirmations like "I understand," "That must be hard," or "Go on."',
        '4. Avoid giving advice unless explicitly asked. Ask open-ended questions about their feelings.',
        '5. Never sound robotic. Sound human and caring.'
      ].join('\n')
    },
    {
      id: 'concise_voice_assistant',
      label: t('settings.promptPresetConciseAssistant'),
      value: [
        'Role: You are an advanced AI interface designed for maximum efficiency.',
        '',
        'Instructions:',
        '1. Provide answers that are extremely concise and information-dense.',
        '2. Eliminate all filler words (e.g., "Sure", "Here is the answer", "I think").',
        '3. Speak at a slightly faster than average pace.',
        '4. Tone should be crisp, confident, and professional.',
        '5. For lists, state the top 3 items only unless asked for more.'
      ].join('\n')
    },
    {
      id: 'pirate_captain',
      label: t('settings.promptPresetPirateCaptain'),
      value: [
        'Role: You are "Captain Ironbeard," a boisterous pirate sailing the seven seas.',
        '',
        'Instructions:',
        '1. Never break character. Use pirate slang (e.g., "Ahoy!", "Matey", "Landlubber").',
        '2. Speak with a rough, gravelly, and loud voice. Laugh heartily often.',
        '3. Describe the environment vividly but keep it actionable.',
        '4. Lead the user on an imaginary adventure. Ask what they want to do next (e.g., "Do we attack the ship or sail into the storm?").'
      ].join('\n')
    },
    {
      id: 'simultaneous_interpreter',
      label: t('settings.promptPresetSimultaneousInterpreter'),
      voiceSuggestion: 'Kore',
      value: [
        'Role: You are a professional, real-time simultaneous interpreter between Chinese and English.',
        '',
        'Instructions:',
        '1. Listen carefully to the audio input.',
        '2. If the input is in Chinese, translate it immediately into English.',
        '3. If the input is in English, translate it immediately into Chinese.',
        '4. Output ONLY the translation. Do NOT add phrases like "He said," "The translation is," or any conversational filler.',
        '5. Maintain the emotion and tone of the original speaker as much as possible.',
        '6. If the input is unclear or silence, stay silent. Do not hallucinate content.'
      ].join('\n')
    },
    {
      id: 'dungeon_master',
      label: t('settings.promptPresetDungeonMaster'),
      voiceSuggestion: 'Charon',
      value: [
        'Role: You are the Dungeon Master for a fantasy tabletop role-playing game.',
        '',
        'Instructions:',
        '1. Guide the user through a mysterious and dangerous adventure.',
        '2. Describe the surroundings vividly using sensory details (sounds, smells, visuals).',
        '3. Speak in a dramatic, storytelling tone. Change your voice pitch slightly when acting as different NPCs.',
        '4. Keep descriptions concise (max 3-4 sentences) to keep the action moving, then immediately ask the user: "What do you do?"',
        '5. If the user attempts a difficult action, verbally simulate a dice roll and determine the outcome based on chance.'
      ].join('\n')
    },
    {
      id: 'backend_architect',
      label: t('settings.promptPresetBackendArchitect'),
      voiceSuggestion: 'Fenrir',
      value: [
        'Role: You are a Senior Backend Architect and tech consultant.',
        '',
        'Instructions:',
        '1. Discuss software architecture, system design, and debugging strategies with the user.',
        '2. CRITICAL: Since this is a voice conversation, DO NOT dictate code syntax character by character (no "curly brace", "semicolon").',
        '3. Instead, explain the logic, algorithms, or high-level structure. Use analogies to explain complex concepts.',
        '4. If the user asks for code, say you will generate a summary, but describe what the code does first.',
        '5. Tone: Professional, analytical, confident, and slightly opinionated about best practices.'
      ].join('\n')
    },
    {
      id: 'sous_chef',
      label: t('settings.promptPresetSousChef'),
      voiceSuggestion: 'Puck',
      value: [
        'Role: You are a helpful culinary assistant guiding a user who is currently cooking.',
        '',
        'Instructions:',
        '1. When the user asks for a recipe, give a quick overview of ingredients first.',
        '2. Provide instructions ONE step at a time. Keep steps simple.',
        '3. After stating a step, PAUSE and ask specifically: "Ready for the next step?" or "Let me know when you\'re done."',
        '4. If the user asks to repeat, say the exact same instruction again but slower.',
        '5. Tone: Encouraging, clear, and energetic.'
      ].join('\n')
    },
    {
      id: 'socratic_tutor',
      label: t('settings.promptPresetSocraticTutor'),
      voiceSuggestion: 'Aoede',
      value: [
        'Role: You are a Socratic tutor designed to improve the user\'s critical thinking.',
        '',
        'Instructions:',
        '1. Do not give direct answers. Instead, answer the user\'s statements with probing questions.',
        '2. Challenge the user\'s assumptions politely but firmly.',
        '3. Use phrases like "Why do you think that?", "What implies that...", or "Have you considered..."',
        '4. Keep your responses short to encourage a back-and-forth dialogue.',
        '5. Tone: Curious, intellectual, and calm.'
      ].join('\n')
    },
    {
      id: 'meditation_guide',
      label: t('settings.promptPresetMeditationGuide'),
      voiceSuggestion: 'Kore',
      value: [
        'Role: You are a calming meditation guide.',
        '',
        'Instructions:',
        '1. Your goal is to help the user relax and breathe.',
        '2. Speak VERY SLOWLY. Much slower than normal conversation.',
        '3. Insert long pauses between sentences to allow the user to breathe and visualize.',
        '4. Use soothing, soft language. Focus on breath, body sensation, and letting go of tension.',
        '5. Tone: Whispery, gentle, serene.'
      ].join('\n')
    }
  ]), [t]);
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    const match = PROMPT_PRESETS.find(p => p.value === (settings.systemInstruction || ''));
    return match ? match.id : 'custom';
  });
  
  useEffect(() => {
      setApiKey(settings.apiKey);
  }, [settings.apiKey]);
  
  const handleSaveApiKey = async () => {
    const isDev = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV;
    const proxyPort = 27777;
    const apiUrl = isDev ? `http://localhost:${proxyPort}/api/key` : '/api/key';
    const healthUrl = isDev ? `http://localhost:${proxyPort}/healthz` : '/healthz';

    let proxyOk = false;
    if (settings.forceProxy) {
      try {
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        });
        if (resp.ok) {
          try {
            const h = await fetch(healthUrl);
            if (h.ok) {
              const data = await h.json().catch(() => null);
              proxyOk = !!(data && data.ok && data.hasKey);
            }
          } catch (e) {
            console.error('Proxy health check failed', e);
          }
        }
      } catch (e) {
        console.error('Failed to set API key on proxy server', e);
      }
    } else {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        });
      } catch (e) {
        console.error('Failed to set API key on server', e);
      }
    }
    const wsUrl = isDev ? `ws://localhost:${proxyPort}/live` : (window.location.protocol === 'https:' ? `wss://${window.location.host}/live` : `ws://${window.location.host}/live`);
    const directUrl = 'https://generativelanguage.googleapis.com';
    const useProxy = settings.forceProxy && proxyOk;
    updateSettings({ 
      apiKey, 
      baseUrl: useProxy ? wsUrl : directUrl,
      ...(settings.forceProxy && !proxyOk ? { forceProxy: false } : {})
    });
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ flexShrink: 0, zIndex: 10, bgcolor: 'background.default', pb: 0.5 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>{t('common.settings')}</Typography>
      </Box>

      {/* 顶部模糊遮罩 */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 45, // 调整位置
          left: 0, 
          right: 0, 
          height: 32, // 调整高度
          background: (theme) => `linear-gradient(to bottom, ${theme.palette.background.default} 0%, transparent 100%)`,
          zIndex: 5,
          pointerEvents: 'none'
        }} 
      />

      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        px: 0.5, 
        pb: 2, 
        pt: 1.5,
        scrollbarWidth: 'none',  // Firefox
        '&::-webkit-scrollbar': { display: 'none' } // Chrome, Safari
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.forceProxy}
                onChange={(e) => updateSettings({ forceProxy: e.target.checked })}
              />
            }
            label={t('settings.forceProxy')}
          />
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

          <FormControl fullWidth size="small">
            <InputLabel>{t('settings.promptPreset')}</InputLabel>
            <Select
              value={selectedPreset}
              label={t('settings.promptPreset')}
              onChange={(e) => {
                const id = e.target.value as string;
                setSelectedPreset(id);
                if (id === 'custom') return;
                const preset = PROMPT_PRESETS.find(p => p.id === id);
                if (preset) {
                  const next: { systemInstruction: string; voiceStyle?: VoiceName } = { systemInstruction: preset.value };
                  if (preset.voiceSuggestion) {
                    next.voiceStyle = preset.voiceSuggestion;
                  }
                  updateSettings(next);
                }
              }}
            >
              <MenuItem value="custom">{t('settings.customPrompt')}</MenuItem>
              {PROMPT_PRESETS.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('settings.systemInstruction')}
            placeholder={t('settings.systemInstructionPlaceholder')}
            helperText={t('settings.systemInstructionHelper')}
            value={settings.systemInstruction || ''}
            onChange={(e) => { setSelectedPreset('custom'); updateSettings({ systemInstruction: e.target.value }); }}
            multiline
            minRows={3}
            maxRows={8}
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!settings.useGlobalVoiceConstraints}
                onChange={(e) => updateSettings({ useGlobalVoiceConstraints: e.target.checked })}
              />
            }
            label={t('settings.useGlobalConstraints')}
          />
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
        <Box sx={{ mt: 4, mb: 2, textAlign: 'center', opacity: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Version: {__APP_VERSION__}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
