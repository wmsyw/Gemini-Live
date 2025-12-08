import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { audioService } from '@/services/audio';
import { HistoryItemCard } from '@/components/HistoryItemCard';

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'one' | 'selected' | 'all'>('one');
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');

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
    if (renameOpen || deleteOpen) {
      node.setAttribute('inert', '');
    } else {
      node.removeAttribute('inert');
    }
  }, [renameOpen, deleteOpen]);

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

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteMode('selected');
    setDeleteOpen(true);
  };

  const handleDeleteAll = () => {
    if (conversationHistory.length === 0) return;
    setDeleteMode('all');
    setDeleteOpen(true);
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
    <Box ref={contentRef} sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ flexShrink: 0, zIndex: 10, bgcolor: 'background.default', pb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>{t('common.history')}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Box>

      {/* 顶部模糊遮罩 */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 100, // 调整位置
          left: 0, 
          right: 0, 
          height: 40, // 增加高度
          background: (theme) => `linear-gradient(to bottom, ${theme.palette.background.default} 0%, transparent 100%)`, // 使用主题背景色过渡
          zIndex: 5,
          pointerEvents: 'none'
        }} 
      />
      
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        px: 0.5, 
        pb: 2, 
        pt: 3,
        scrollbarWidth: 'none',  // Firefox
        '&::-webkit-scrollbar': { display: 'none' } // Chrome, Safari
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {conversationHistory.map((item) => (
            <HistoryItemCard
                key={item.id}
                item={item}
                isPlaying={playingId === item.id}
                isPaused={paused}
                playProgress={playProgress}
                isSelected={selected.includes(item.id)}
                onPlay={handlePlay}
                onRename={() => openRename(item)}
                onDelete={() => {
                    setDeleteMode('one');
                    setDeleteTargetId(item.id);
                    setDeleteOpen(true);
                }}
                onSelect={() => toggleSelect(item.id)}
                formatDate={formatDate}
                formatDuration={formatDuration}
            />
            ))}
            {conversationHistory.length === 0 && (
                <Typography variant="body1" color="text.secondary" align="center" mt={4}>
                    {t('historyPage.empty')}
                </Typography>
            )}
        </Box>
      </Box>
      <Dialog 
        open={deleteOpen} 
        onClose={() => { setDeleteOpen(false); setDeleteTargetId(''); }} 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {deleteMode === 'one' ? t('historyPage.confirmDeleteOne') : deleteMode === 'selected' ? t('historyPage.confirmDeleteSelected') : t('historyPage.confirmDeleteAll')}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 0, px: 3 }}>
          {deleteMode === 'one' && (
            <Typography variant="body2" color="text.secondary">
              {(() => {
                const item = conversationHistory.find(h => h.id === deleteTargetId);
                const title = item ? (item.summary || `Conversation ${formatDate(item.timestamp)}`) : '';
                const count = item ? item.messages.length : 0;
                return `${title} — ${count} messages`;
              })()}
            </Typography>
          )}
          {deleteMode === 'selected' && (
            <Typography variant="body2" color="text.secondary">
              {t('historyPage.deleteSelectedCount', { count: selected.length })}
            </Typography>
          )}
          {deleteMode === 'all' && (
            <Typography variant="body2" color="text.secondary">
              {t('historyPage.deleteAllCount', { count: conversationHistory.length })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteOpen(false); setDeleteTargetId(''); }}>{t('common.cancel')}</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={async () => {
              if (deleteMode === 'one' && deleteTargetId) {
                await deleteHistory(deleteTargetId);
                setSelected(prev => prev.filter(id => id !== deleteTargetId));
              } else if (deleteMode === 'selected') {
                if (selected.length === 0) { setDeleteOpen(false); return; }
                await deleteHistories(selected);
                setSelected([]);
              } else {
                await clearAllHistory();
                setSelected([]);
              }
              setDeleteOpen(false);
              setDeleteTargetId('');
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog 
        open={renameOpen} 
        onClose={() => setRenameOpen(false)} 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3 } }}
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
