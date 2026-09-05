import React from 'react';
import { sanitizeInput } from '../../security/sanitizer';
import { VoiceMicButton } from './VoiceMicButton';

interface SecureInputProps {
  id?: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helpText?: string;
  enableVoice?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  disabled,
  helpText,
  enableVoice = true
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize input live to prevent malicious script injection
    const cleaned = sanitizeInput(e.target.value);
    onChange(cleaned);
  };

  const handleVoiceTranscribe = (transcribedText: string) => {
    const cleaned = sanitizeInput(transcribedText);
    onChange(cleaned);
  };

  const showVoice = enableVoice && (type === 'text' || type === 'email' || type === 'tel');

  return (
    <div className="form-group">
      <div className="field-label-row">
        <label htmlFor={id || name} className="field-label">
          {label} {required && <span className="text-required">*</span>}
        </label>
        {showVoice && (
          <VoiceMicButton
            fieldLabel={label}
            currentValue={value ? String(value) : ''}
            onTranscribe={handleVoiceTranscribe}
            disabled={disabled}
          />
        )}
      </div>
      <input
        id={id || name}
        name={name}
        type={type}
        className={`form-input ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {helpText && !error && <p className="field-help">{helpText}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
};
