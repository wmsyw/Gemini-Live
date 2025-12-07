import React, { useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { audioService } from '@/services/audio';

interface Props {
  isActive: boolean;
}

export const AudioVisualizer: React.FC<Props> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const theme = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size to match display size
    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If not active, draw a flat line
    if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = theme.palette.text.disabled;
        ctx.lineWidth = 2;
        ctx.stroke();
        return () => window.removeEventListener('resize', resizeCanvas);
    }

    const analyser = audioService.getAnalyser();
    
    // Fallback animation if analyser is not ready but active (e.g. waiting for mic)
    if (!analyser) {
         // ... simple pulse animation?
         return () => window.removeEventListener('resize', resizeCanvas);
    }

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = theme.palette.background.default;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive, theme]);

  return (
    <Box sx={{ width: '100%', height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};
