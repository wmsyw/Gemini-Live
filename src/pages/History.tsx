import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, IconButton, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, LinearProgress } from '@mui/material';
import { useStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { PlayCircle, PauseCircle, Trash2, Edit } from 'lucide-react';
import { audioService } from '@/services/audio';

const History: React.FC = () => {
  const { t } = useTranslation();
  const { conversationHistory, deleteHistory, deleteHistories, clearAllHistory, settings } = useStore();
  const rename = useStore(state => state.renameHistory);
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = useMemo(() => selected.length === conversationHistory.length && selected.length > 0, [selected, conversationHistory.length]);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string>('');
  const [renameValue, setRenameValue] = useState<string>('');
  const canSave = (renameValue.trim().length > 0);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<number>(0);
  const playTimerRef = useRef<number | null>(null);
  const [paused, setPaused] = useState<boolean>(false);

  useEffect(() => {
    if (renameOpen) {
      requestAnimationFrame(() => {
        renameInputRef.current?.focus();
        const el = renameInputRef.current as HTMLInputElement | null;
        if (el && typeof el.select === 'function') el.select();
      });
    }
  }, [renameOpen]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    if (renameOpen) {
      node.setAttribute('inert', '');
    } else {
      node.removeAttribute('inert');
    }
  }, [renameOpen]);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, []);

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
    // 同一条目：播放中点击则暂停；暂停中点击则继续
    if (playingId === item.id) {
      if (!paused) {
        await audioService.suspendContext();
        setPaused(true);
        return;
      } else {
        await audioService.resumeContext();
        setPaused(false);
        return;
      }
    }

    // 切换到新条目前，停止旧播放并清理状态
    if (playingId) {
      audioService.stopPlayback();
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      setPlayingId(null);
      setPlayProgress(0);
      setPaused(false);
    }

    try {
      await audioService.initialize();
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
      setPlayingId(item.id);
      setPaused(false);
      setPlayProgress(0);
      const totalSec = audios.reduce((sum, buf) => sum + (new Int16Array(buf).length / 24000), 0);
      const startCtx = audioService.getCurrentTime();
      audios.forEach(buf => audioService.playAudio(buf));
      const tick = () => {
        const elapsed = audioService.getCurrentTime() - startCtx;
        const ratio = Math.min(elapsed / totalSec, 1);
        setPlayProgress(Math.round(ratio * 100));
        if (ratio < 1) {
          playTimerRef.current = window.setTimeout(tick, 100);
        } else {
          setPlayingId(null);
          setPaused(false);
          playTimerRef.current = null;
        }
      };
      tick();
    } catch (e) {
      console.error('Playback error', e);
      setPlayingId(null);
      setPaused(false);
      setPlayProgress(0);
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    }
  };

  const openRename = (item: typeof conversationHistory[number]) => {
    setRenameId(item.id);
    setRenameValue(item.summary || `Conversation ${formatDate(item.timestamp)}`);
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    if (!renameId) return;
    const value = renameValue.trim();
    if (value.length === 0) {
      setRenameOpen(false);
      return;
    }
    await rename(renameId, value);
    setRenameOpen(false);
    setRenameId('');
    setRenameValue('');
  };

  return (
    <Box ref={contentRef}>
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
                    {playingId === item.id && !paused ? <PauseCircle /> : <PlayCircle />}
                  </IconButton>
                  <IconButton edge="end" aria-label="rename" onClick={() => openRename(item)}>
                    <Edit />
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
                        {playingId === item.id && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress variant="determinate" value={playProgress} />
                          </Box>
                        )}
                    </React.Fragment>
                }
                sx={{ pr: 9 }}
                primaryTypographyProps={{
                  sx: {
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden'
                  }
                }}
                secondaryTypographyProps={{ component: 'div' }}
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
      <Dialog 
        open={renameOpen} 
        onClose={() => setRenameOpen(false)} 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3 } }}
        container={() => document.getElementById('root') as HTMLElement}
      >
        <DialogTitle sx={{ pb: 1 }}>{t('historyPage.renameTitle')}</DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 0, px: 3 }}>
          <TextField 
            autoFocus 
            fullWidth 
            value={renameValue} 
            onChange={(e) => setRenameValue(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) handleRenameSave(); }}
            label={t('historyPage.renameLabel')} 
            placeholder={t('historyPage.renamePlaceholder')}
            helperText={t('historyPage.renameHelper')}
            inputProps={{ maxLength: 100 }}
            InputLabelProps={{ shrink: true }}
            margin="dense"
            size="small"
            inputRef={renameInputRef}
            variant="outlined" 
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRenameOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleRenameSave} disabled={!canSave}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default History;
