import React, { useMemo, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, IconButton, Checkbox, Button } from '@mui/material';
import { useStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { PlayCircle, Trash2 } from 'lucide-react';
import { audioService } from '@/services/audio';

const History: React.FC = () => {
  const { t } = useTranslation();
  const { conversationHistory, deleteHistory, deleteHistories, clearAllHistory, settings } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = useMemo(() => selected.length === conversationHistory.length && selected.length > 0, [selected, conversationHistory.length]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const formatDuration = (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(conversationHistory.map(h => h.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!confirm(t('historyPage.confirmDeleteSelected'))) return;
    await deleteHistories(selected);
    setSelected([]);
  };

  const handleDeleteAll = async () => {
    if (conversationHistory.length === 0) return;
    if (!confirm(t('historyPage.confirmDeleteAll'))) return;
    await clearAllHistory();
    setSelected([]);
  };

  const handlePlay = async (item: typeof conversationHistory[number]) => {
    try {
      await audioService.resumeContext();
      const audios = item.messages.filter(m => m.data.audio).map(m => m.data.audio as ArrayBuffer);
      if (audios.length === 0) {
        const texts = item.messages.filter(m => m.data.text).map(m => m.data.text as string);
        if (texts.length === 0) return;
        const utterance = new SpeechSynthesisUtterance(texts.join('\n'));
        utterance.lang = settings.language === 'zh-CN' ? 'zh-CN' : 'en-US';
        window.speechSynthesis.speak(utterance);
        return;
      }
      audios.forEach(buf => audioService.playAudio(buf));
    } catch (e) {
      console.error('Playback error', e);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>{t('common.history')}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={toggleSelectAll} disabled={conversationHistory.length === 0}>
          {t('historyPage.selectAll')}
        </Button>
        <Button variant="outlined" color="error" onClick={handleDeleteSelected} disabled={selected.length === 0}>
          {t('historyPage.deleteSelected')}
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteAll} disabled={conversationHistory.length === 0}>
          {t('historyPage.deleteAll')}
        </Button>
      </Box>
      
      <List>
        {conversationHistory.map((item) => (
          <Paper key={item.id} sx={{ mb: 2, borderRadius: 2 }} elevation={1}>
            <ListItem
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton edge="end" aria-label="play" onClick={() => handlePlay(item)}>
                    <PlayCircle />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={async () => {
                    if (!confirm(t('historyPage.confirmDeleteOne'))) return;
                    await deleteHistory(item.id);
                  }}>
                    <Trash2 />
                  </IconButton>
                </Box>
              }
            >
              <Checkbox
                checked={selected.includes(item.id)}
                onChange={() => toggleSelect(item.id)}
                sx={{ mr: 1 }}
              />
              <ListItemText
                primary={item.summary || `Conversation ${formatDate(item.timestamp)}`}
                secondary={
                    <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                            {formatDate(item.timestamp)}
                        </Typography>
                        {" — " + formatDuration(item.duration) + ` (${item.messages.length} messages)`}
                    </React.Fragment>
                }
              />
            </ListItem>
          </Paper>
        ))}
        {conversationHistory.length === 0 && (
            <Typography variant="body1" color="text.secondary" align="center" mt={4}>
                {t('historyPage.empty')}
            </Typography>
        )}
      </List>
    </Box>
  );
};

export default History;
