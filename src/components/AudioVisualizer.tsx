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

    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = parent.clientWidth * dpr;
            canvas.height = parent.clientHeight * dpr;
            canvas.style.width = parent.clientWidth + 'px';
            canvas.style.height = parent.clientHeight + 'px';
        }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return () => window.removeEventListener('resize', resizeCanvas);
    }

    const analyser = audioService.getAnalyser();

    if (!analyser) {
         return () => window.removeEventListener('resize', resizeCanvas);
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 64;
    const barSpacing = 0.2;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / barCount) * (1 - barSpacing);
      const gap = (canvas.width / barCount) * barSpacing;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * bufferLength / barCount);
        const amplitude = dataArray[dataIndex] / 255;

        const barHeight = amplitude * canvas.height * 0.8;
        const x = i * (barWidth + gap);
        const y = canvas.height / 2 - barHeight / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, theme.palette.primary.main);
        gradient.addColorStop(0.5, theme.palette.primary.light);
        gradient.addColorStop(1, theme.palette.primary.main);

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 8;
        ctx.shadowColor = theme.palette.primary.main;

        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight || 2, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive, theme]);

  return (
    <Box sx={{ width: '100%', height: 160, display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};
