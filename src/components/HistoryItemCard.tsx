import React from 'react';
import { Box, Typography, Card, IconButton, useTheme, alpha, LinearProgress, Chip } from '@mui/material';
import { Play, Pause, Trash2, Edit2, Calendar, Clock, Music } from 'lucide-react';
import { ConversationHistory } from '@/types';

interface HistoryItemCardProps {
  item: ConversationHistory;
  isPlaying: boolean;
  isPaused: boolean;
  playProgress: number;
  isSelected: boolean;
  onPlay: (item: ConversationHistory) => void;
  onRename: (id: string, currentSummary: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  formatDate: (timestamp: number) => string;
  formatDuration: (ms: number) => string;
}

export const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  item,
  isPlaying,
  isPaused,
  playProgress,
  isSelected,
  onPlay,
  onRename,
  onDelete,
  onSelect,
  formatDate,
  formatDuration,
}) => {
  const theme = useTheme();
  const hasAudio = item.messages.some(m => m.data.audio);
  const audioCount = item.messages.filter(m => m.data.audio).length;

  return (
    <Card
      elevation={isSelected ? 4 : 1}
      sx={{
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
        border: isSelected
            ? `2px solid ${theme.palette.primary.main}`
            : isPlaying
            ? `2px solid ${alpha(theme.palette.primary.main, 0.5)}`
            : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.04)
            : isPlaying
            ? alpha(theme.palette.primary.main, 0.02)
            : 'background.paper',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
            onClick={() => onSelect(item.id)}
            sx={{
                px: 2,
                pt: 1.5,
                pb: 0.5,
                cursor: 'pointer',
                flexGrow: 1
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Typography
                  variant="subtitle1"
                  component="div"
                  sx={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      lineHeight: 1.4,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: 'text.primary',
                      letterSpacing: '0.01em'
                  }}
              >
                  {item.summary || '无标题对话'}
              </Typography>
              {hasAudio && (
                <Chip
                  icon={<Music size={12} />}
                  label={audioCount}
                  size="small"
                  sx={{
                    height: 20,
                    ml: 1,
                    fontSize: '0.7rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-icon': {
                      color: theme.palette.primary.main,
                      marginLeft: '4px'
                    }
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', opacity: 0.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Calendar size={12} />
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {formatDate(item.timestamp)}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>•</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Clock size={12} />
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {formatDuration(item.duration)}
                    </Typography>
                </Box>
            </Box>
        </Box>

        {isPlaying && (
          <Box sx={{ px: 1.5, pt: 0.5, pb: 0.5 }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <LinearProgress
                 variant="determinate"
                 value={playProgress}
                 sx={{
                   flex: 1,
                   borderRadius: 1,
                   height: 5,
                   bgcolor: alpha(theme.palette.primary.main, 0.1),
                   '& .MuiLinearProgress-bar': {
                     borderRadius: 1,
                     bgcolor: theme.palette.primary.main,
                   }
                 }}
               />
               <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.main', fontWeight: 600, minWidth: 35, textAlign: 'right' }}>
                 {playProgress}%
               </Typography>
             </Box>
          </Box>
        )}

        <Box
            sx={{
                px: 2,
                pb: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                pt: 1
            }}
        >
            <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onPlay(item); }}
                color={isPlaying ? "primary" : "default"}
                disabled={!hasAudio && item.messages.filter(m => m.data.text).length === 0}
                sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isPlaying ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                    '&:hover': {
                      bgcolor: isPlaying
                        ? alpha(theme.palette.primary.main, 0.25)
                        : alpha(theme.palette.primary.main, 0.1)
                    }
                }}
            >
                {isPlaying && !isPaused ? <Pause size={18} /> : <Play size={18} />}
            </IconButton>

            <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onRename(item.id, item.summary); }}
                sx={{
                    width: 32,
                    height: 32,
                    '&:hover': { color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.1) }
                }}
            >
                <Edit2 size={18} />
            </IconButton>

            <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                sx={{
                    width: 32,
                    height: 32,
                    '&:hover': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) }
                }}
            >
                <Trash2 size={18} />
            </IconButton>
        </Box>
      </Box>
    </Card>
  );
};
