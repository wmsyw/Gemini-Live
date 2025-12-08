import React from 'react';
import { Box, Typography, Paper, useTheme, Avatar } from '@mui/material';
import { LiveMessage } from '@/types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: LiveMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';

  if (!message.data.text) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2.5,
        width: '100%',
        gap: 1.5,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'secondary.main',
            boxShadow: theme.shadows[2],
            mt: 0.5
          }}
        >
          <Bot size={18} />
        </Avatar>
      )}

      <Paper
        elevation={isUser ? 0 : 0}
        sx={{
          p: 2,
          maxWidth: '75%',
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 3,
          borderTopLeftRadius: !isUser ? 4 : 24,
          borderTopRightRadius: isUser ? 4 : 24,
          wordBreak: 'break-word',
          position: 'relative',
          boxShadow: isUser 
            ? `0 4px 12px ${theme.palette.primary.main}40`
            : theme.shadows[1],
          border: !isUser ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Typography 
            variant="body1" 
            sx={{ 
                lineHeight: 1.6,
                fontSize: '0.95rem',
                fontWeight: 400,
                letterSpacing: '0.01em'
            }}
        >
          {message.data.text}
        </Typography>
      </Paper>

      {isUser && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            boxShadow: theme.shadows[2],
            mt: 0.5
          }}
        >
          <User size={18} />
        </Avatar>
      )}
    </Box>
  );
};
