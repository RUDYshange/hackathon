import React, { useState, useEffect, useRef } from 'react';
import { liveTranscribeService } from '../../services/geminiLiveService';
import { Mic, Loader2 } from 'lucide-react';

interface VoiceMicButtonProps {
  onTranscribe: (text: string) => void;
  appendMode?: boolean;
  currentValue?: string;
  fieldLabel?: string;
  disabled?: boolean;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  onTranscribe,
  appendMode = false,
  currentValue = '',
  fieldLabel,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0);
  const baseValueRef = useRef<string>(currentValue);

  useEffect(() => {
    return () => {
      if (isListening) {
        liveTranscribeService.stop();
      }
    };
  }, [isListening]);

  const toggleListening = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (isListening) {
      await liveTranscribeService.stop();
      setIsListening(false);
      setStatus('idle');
      setVolume(0);
      return;
    }

    baseValueRef.current = currentValue || '';
    setIsListening(true);
    setStatus('connecting');

    try {
      await liveTranscribeService.start({
        onStatusChange: (s) => {
          if (s === 'listening') setStatus('listening');
          else if (s === 'error') {
            setStatus('error');
            setIsListening(false);
          } else if (s === 'idle' || s === 'stopped') {
            setStatus('idle');
            setIsListening(false);
          }
        },
        onTranscript: (full) => {
          if (appendMode && baseValueRef.current) {
            onTranscribe(`${baseValueRef.current} ${full}`.trim());
          } else {
            onTranscribe(full);
          }
        },
        onVolumeChange: (vol) => {
          setVolume(vol);
        },
        onError: (err) => {
          console.warn('[VoiceMicButton] Notice:', err);
          setIsListening(false);
          setStatus('idle');
        }
      });
    } catch (err: any) {
      console.error('[VoiceMicButton] Failed to start:', err);
      setIsListening(false);
      setStatus('error');
    }
  };

  return (
    <div className="voice-mic-container">
      <button
        type="button"
        className={`voice-mic-btn ${isListening ? 'active' : ''} ${status === 'connecting' ? 'connecting' : ''}`}
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Click to stop live dictation' : `Dictate ${fieldLabel || 'field'} with Gemini 3.5 Transcribe Live`}
        aria-label={isListening ? 'Stop listening' : 'Start speech to text'}
      >
        {status === 'connecting' ? (
          <Loader2 size={13} className="spin-icon" />
        ) : isListening ? (
          <div className="mic-active-wrapper">
            <span
              className="mic-wave-ring"
              style={{ transform: `scale(${1 + volume * 0.8})`, opacity: 0.4 + volume * 0.6 }}
            />
            <Mic size={13} className="mic-listening-icon" />
          </div>
        ) : (
          <Mic size={13} />
        )}
      </button>

      {isListening && (
        <span className="voice-pulse-badge" title="Gemini 3.5 Transcribe Live active">
          <span className="pulse-dot" /> Live
        </span>
      )}
    </div>
  );
};
