import React, { useEffect, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Mic, StopCircle } from 'lucide-react';
import { useStore } from '@/store';
import { audioService } from '@/services/audio';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ModelPart, ServerMessage } from '@/types/index';
import { ChatMessage } from '@/components/ChatMessage';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    isConnected, 
    isRecording, 
    currentConversation, 
    setConnected, 
    setRecording, 
    addMessage,
    startSession,
    endSession,
    geminiClient,
    initializeGeminiClient,
    settings
  } = useStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation.messages]);

  const handleToggleRecording = async () => {
    if (!settings.apiKey) {
        // Show a more user-friendly alert or redirect
        if (confirm('请先在设置中配置 API Key。是否前往设置？')) {
            navigate('/settings');
        }
        return;
    }

    if (isConnected) {
      await handleStop();
    } else {
      try {
        audioService.resumeContext();

        // Ensure client is initialized
        if (!geminiClient) {
            initializeGeminiClient();
        }

        // Get the client from store (state updates might be batched, but direct access via getState is safe for logic)
        const client = useStore.getState().geminiClient;
        if (!client) return;

        await client.connect(
            (message: ServerMessage) => {
                if (message.serverContent?.modelTurn) {
                     const parts = message.serverContent.modelTurn.parts as ModelPart[];
                     parts.forEach((part: ModelPart) => {
                         if ('text' in part) {
                             addMessage({
                                 type: 'output',
                                 timestamp: Date.now(),
                                 role: 'model',
                                 data: { text: part.text }
                             });
                         }
                         if ('inlineData' in part) {
                             const binaryString = window.atob(part.inlineData.data);
                             const len = binaryString.length;
                             const bytes = new Uint8Array(len);
                             for (let i = 0; i < len; i++) {
                                 bytes[i] = binaryString.charCodeAt(i);
                             }
                             audioService.playAudio(bytes.buffer);
                             addMessage({
                                 type: 'output',
                                 timestamp: Date.now(),
                                 role: 'model',
                                 data: { audio: bytes.buffer }
                             });
                         }
                     });
                }
                const sc = (message as unknown as { serverContent?: { output_transcription?: { text?: string }, outputTranscription?: { text?: string } }, setupComplete?: boolean }).serverContent;
                const transcription = sc?.output_transcription?.text || sc?.outputTranscription?.text;
                if (transcription) {
                    addMessage({
                        type: 'output',
                        timestamp: Date.now(),
                        role: 'model',
                        data: { text: transcription }
                    });
                }
                const setupDone = (message as unknown as { setupComplete?: boolean, setup_complete?: boolean }).setupComplete
                  || (message as unknown as { setup_complete?: boolean }).setup_complete;
                if (setupDone && !useStore.getState().isRecording) {
                    const instruction = settings.language === 'zh-CN'
                      ? '接下来请只用中文回复，并使用中文语音输出。'
                      : 'Please reply in English only, both text and speech.';
                    client.sendText(instruction);
                    audioService.startRecording((data) => {
                        client.sendAudioData(data);
                    }).then(() => {
                        setRecording(true);
                    }).catch((err) => {
                        console.error('Failed to start recording:', err);
                    });
                }
            },
            (error) => {
                console.error("Gemini Error", error);
                setConnected(false);
                setRecording(false);
                alert(`Connection Error: ${error}`);
            },
            () => {
                console.log("Gemini Closed");
                setConnected(false);
                setRecording(false);
            }
        );

        setConnected(true);
        startSession();
        
      } catch (error) {
        console.error('Failed to start:', error);
        setConnected(false);
        setRecording(false);
        alert('Failed to connect to Gemini Live API. Check console for details.');
      }
    }
  };
  
  const handleStop = async () => {
      audioService.stopRecording();
      const client = useStore.getState().geminiClient;
      client?.disconnect();
      setRecording(false);
      setConnected(false);
      await endSession();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {!isConnected && currentConversation.messages.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.6 }}>
          <Mic size={48} />
          <Typography variant="h6" mt={2}>{t('home.welcome')}</Typography>
        </Box>
      )}

      <Box sx={{ flexShrink: 0, mt: 'auto' }}>
        <AudioVisualizer isActive={isConnected} />

        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2, alignItems: 'center', flexDirection: 'column' }}>
            <IconButton
                onClick={handleToggleRecording}
                sx={{
                    width: 72,
                    height: 72,
                    bgcolor: isConnected ? 'error.main' : 'primary.main',
                    color: 'white',
                    '&:hover': {
                        bgcolor: isConnected ? 'error.dark' : 'primary.dark',
                    },
                    boxShadow: 4,
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation'
                }}
            >
                {isConnected ? <StopCircle size={36} /> : <Mic size={36} />}
            </IconButton>

            <Box sx={{ height: 24, mt: 1 }}>
            {isConnected && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 'medium' }}>
                    {isRecording ? t('home.listening') : 'Connecting...'}
                </Typography>
            )}
            </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
