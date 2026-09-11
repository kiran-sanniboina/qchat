import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';

export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // collect 100ms slices
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMsg(err.message || 'Microphone access denied or unavailable.');
    }
  };

  const handleStopAndSend = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      if (onCancel) onCancel();
      return;
    }

    setUploading(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 500) {
          alert('Voice note too short.');
          cleanup();
          if (onCancel) onCancel();
          return;
        }

        const filename = `voice_${Date.now()}.webm`;
        const file = new File([audioBlob], filename, { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('isVoice', 'true');

        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const { mediaUrl, size } = res.data;

        await onSendVoice({
          message: '',
          mediaUrl,
          mediaType: 'voice',
          mediaFilename: filename,
          fileSize: size || audioBlob.size
        });

        cleanup();
      } catch (err) {
        console.error('Upload voice error:', err);
        alert('Failed to send voice message: ' + (err.response?.data?.error || err.message));
        cleanup();
        if (onCancel) onCancel();
      }
    };

    mediaRecorderRef.current.stop();
  };

  const handleCancel = () => {
    cleanup();
    if (onCancel) onCancel();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (errorMsg) {
    return (
      <div className="flex-1 flex items-center justify-between px-4 py-2 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorMsg}</span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-xs font-semibold"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-between px-3 sm:px-4 py-2 bg-wa-panel border border-wa-border rounded-xl animate-in fade-in zoom-in-95">
      {/* Recording Indicator + Waves */}
      <div className="flex items-center space-x-2.5 min-w-0">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>

        {/* Live Timer */}
        <span className="font-mono text-xs sm:text-sm font-semibold text-wa-textPrimary shrink-0">
          {formatTimer(duration)}
        </span>

        {/* Audio Wave Simulation */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 px-2 overflow-hidden">
          {[40, 75, 55, 90, 30, 85, 60, 95, 45, 80, 65, 90, 50, 70].map((h, i) => (
            <span
              key={i}
              style={{ height: `${Math.max(6, (h * ((duration % 3) + 1)) / 3)}px` }}
              className="w-1 bg-quantum-cyan/80 rounded-full transition-all duration-150"
            />
          ))}
        </div>

        <span className="hidden sm:inline text-[11px] text-wa-textSecondary font-medium truncate">
          Recording Voice Message...
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          type="button"
          onClick={handleCancel}
          disabled={uploading}
          className="p-2 text-wa-textSecondary hover:text-red-400 hover:bg-wa-hover rounded-full transition"
          title="Discard voice recording"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          disabled={uploading}
          className="p-2 sm:p-2.5 bg-wa-green hover:bg-wa-greenHover text-white rounded-full shadow transition disabled:opacity-50"
          title="Send voice message"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

