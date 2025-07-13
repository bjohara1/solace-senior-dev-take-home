import React from 'react';
import { VoiceSettings as VoiceSettingsType } from '../App';

interface VoiceSettingsProps {
  settings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ settings, onSettingsChange }) => {
  const handleVoiceChange = (voice: 'male' | 'female') => {
    onSettingsChange({ ...settings, voice });
  };

  const handleSpeedChange = (speed: number) => {
    onSettingsChange({ ...settings, speed });
  };

  const handlePitchChange = (pitch: number) => {
    onSettingsChange({ ...settings, pitch });
  };

  return (
    <div className="voice-settings">
      <h3>Voice Settings</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <label>Voice Type:</label>
          <div className="voice-buttons">
            <button
              className={`voice-btn ${settings.voice === 'female' ? 'active' : ''}`}
              onClick={() => handleVoiceChange('female')}
            >
              👩 Female
            </button>
            <button
              className={`voice-btn ${settings.voice === 'male' ? 'active' : ''}`}
              onClick={() => handleVoiceChange('male')}
            >
              👨 Male
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Speed: {settings.speed}x</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        <div className="setting-group">
          <label>Pitch: {settings.pitch}x</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
            className="slider"
          />
        </div>
      </div>


    </div>
  );
}; 