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

  initialize(): void {
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
    this.initialize();
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
    if (!this.context || !this.analyser) return;
    if (this.context.state === 'closed') return;
    if (this.context.state !== 'running') {
      void this.context.resume();
    }

    // Convert Int16 PCM to Float32
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    // Gemini output is always 24kHz
    const contextRate = this.context.sampleRate;
    const audioData = this.resampleAudio(float32Array, 24000, contextRate);
    const buffer = this.context.createBuffer(1, audioData.length, contextRate);
    buffer.copyToChannel(audioData, 0);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    // 输出音频同时接到分析器，以显示播放频谱
    source.connect(this.analyser);
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

  private resampleAudio(input: Float32Array, srcRate: number, dstRate: number): Float32Array {
    if (srcRate === dstRate) return input;
    const ratio = dstRate / srcRate;
    const length = Math.max(1, Math.round(input.length * ratio));
    const output = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const pos = i / ratio;
      const idx = Math.floor(pos);
      const next = Math.min(idx + 1, input.length - 1);
      const frac = pos - idx;
      output[i] = input[idx] + (input[next] - input[idx]) * frac;
    }
    return output;
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  }

  async unlock(): Promise<void> {
    this.initialize();
    if (!this.context) return;

    if (this.context.state === 'closed') {
      this.context = null;
      this.analyser = null;
      this.silentGain = null;
      this.initialize();
    }
    if (!this.context) return;

    try {
      const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start(0);
      source.stop(0);

      if (this.context.state !== 'running') {
        await this.context.resume();
      }
      this.nextStartTime = this.context.currentTime;
      console.log('AudioContext unlocked, state:', this.context.state);
    } catch (e) {
      console.error('AudioContext unlock failed:', e);
    }
  }

  async unlockAudioForIOS(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' });
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.5;
      this.silentGain = this.context.createGain();
      this.silentGain.gain.value = 0;
      this.silentGain.connect(this.context.destination);
    }

    const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    src.connect(this.context.destination);
    src.start(0);
    src.stop(0);

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async resumeContext(): Promise<void> {
    if (this.context?.state === 'suspended') {
      try {
        await this.context.resume();
        console.log('AudioContext resumed');
      } catch (e) {
        console.error('Resume context error:', e);
      }
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
      try {
        await this.context.suspend();
      } catch (e) {
        console.error('Suspend context error:', e);
      }
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
