export class AudioService {
  private context: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private stream: MediaStream | null = null;
  private onAudioData: ((data: ArrayBuffer) => void) | null = null;
  
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  async initialize(): Promise<void> {
    if (this.context) return;
    
    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.5;
    this.silentGain = this.context.createGain();
    this.silentGain.gain.value = 0;
    this.silentGain.connect(this.context.destination);
  }
  
  async startRecording(onAudioData: (data: ArrayBuffer) => void): Promise<void> {
    await this.initialize();
    if (!this.context) return;
    
    this.onAudioData = onAudioData;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      
      this.inputSource = this.context.createMediaStreamSource(this.stream);
      
      await this.context.audioWorklet.addModule(new URL('../worklets/pcm-processor.js', import.meta.url));
      this.workletNode = new AudioWorkletNode(this.context, 'pcm-processor');
      
      this.workletNode.port.onmessage = (ev) => {
        const buffer = ev.data as ArrayBuffer;
        if (this.onAudioData) this.onAudioData(buffer);
      };
      
      // 录音采集：输入同时送往 Worklet 与分析器
      this.inputSource.connect(this.workletNode);
      this.inputSource.connect(this.analyser!);
      
      // 保持音频图活跃但不产生回放
      this.analyser!.connect(this.silentGain!);
      this.workletNode.connect(this.silentGain!);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }
  
  stopRecording(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.workletNode) {
      // 清理消息回调，断开节点连接
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.workletNode.port.onmessage = null as any;
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
  }
  
  playAudio(pcmData: ArrayBuffer): void {
    if (!this.context) return;
    
    // Convert Int16 PCM to Float32
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }
    
    // Gemini output is always 24kHz
    const buffer = this.context.createBuffer(1, float32Array.length, 24000);
    buffer.copyToChannel(float32Array, 0);
    
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    // 输出音频同时接到分析器，以显示播放频谱
    source.connect(this.analyser!);
    source.connect(this.context.destination);
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
    
    const currentTime = this.context.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }
  
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
  
  getSampleRate(): number {
    return this.context?.sampleRate || 48000;
  }
  
  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  }
  
  async resumeContext(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  stopPlayback(): void {
    if (!this.context) return;
    for (const s of this.activeSources) {
      try { s.stop(); } catch (e) { void e; }
      try { s.disconnect(); } catch (e) { void e; }
    }
    this.activeSources = [];
    this.nextStartTime = this.context.currentTime;
  }

  async suspendContext(): Promise<void> {
    if (this.context?.state === 'running') {
      await this.context.suspend();
    }
  }

  isSuspended(): boolean {
    return this.context?.state === 'suspended';
  }

  getCurrentTime(): number {
    return this.context?.currentTime || 0;
  }
}

export const audioService = new AudioService();
