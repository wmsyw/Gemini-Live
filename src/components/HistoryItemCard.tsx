import React from 'react';
import { Box, Typography, Card, IconButton, useTheme, alpha, LinearProgress } from '@mui/material';
import { Play, Pause, Trash2, Edit2, Calendar, Clock } from 'lucide-react';
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
            : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
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
            <Typography 
                variant="subtitle1" 
                component="div" 
                sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.95rem',
                    lineHeight: 1.4,
                    mb: 0.5,
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
             <LinearProgress variant="determinate" value={playProgress} sx={{ borderRadius: 1, height: 4 }} />
          </Box>
        )}

        <Box 
            sx={{ 
                px: 1,
                pb: 0.5,
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 0.5,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                pt: 0.5
            }}
        >
            <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onPlay(item); }}
                color={isPlaying ? "primary" : "default"}
                sx={{ 
                    width: 28,
                    height: 28,
                    bgcolor: isPlaying ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
            >
                {isPlaying && !isPaused ? <Pause size={16} /> : <Play size={16} />}
            </IconButton>
            
            <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onRename(item.id, item.summary); }}
                sx={{ 
                    width: 28,
                    height: 28,
                    '&:hover': { color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.1) } 
                }}
            >
                <Edit2 size={16} />
            </IconButton>
            
            <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                sx={{ 
                    width: 28,
                    height: 28,
                    '&:hover': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) } 
                }}
            >
                <Trash2 size={16} />
            </IconButton>
        </Box>
      </Box>
    </Card>
  );
};
