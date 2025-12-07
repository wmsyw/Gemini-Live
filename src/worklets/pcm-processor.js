// 将输入的 Float32 音频流转为 Int16 PCM，并通过 port 发送到主线程
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }
    const channelData = input[0];
    const out = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    this.port.postMessage(out.buffer);
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
