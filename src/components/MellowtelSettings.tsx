import React, { useState, useEffect } from 'react';
import {
  getMellowtelStatus,
  toggleMellowtel,
  saveMellowtelConfig,
  loadMellowtelConfig,
  MellowtelConfig,
  MellowtelStats
} from '../services/mellowtelService';

interface MellowtelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MellowtelSettings: React.FC<MellowtelSettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<MellowtelConfig>({
    enabled: true,
    allowedDomains: ['*'],
    maxBandwidthUsage: 1000,
    shareOnlyWhenIdle: false
  });
  const [stats, setStats] = useState<MellowtelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configData, statusData] = await Promise.all([
        loadMellowtelConfig(),
        getMellowtelStatus()
      ]);
      setConfig(configData);
      setStats(statusData.stats);
    } catch (err) {
      setError('Failed to load Mellowtel settings');
      console.error('Error loading Mellowtel settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newEnabled = !config.enabled;
      await toggleMellowtel(newEnabled);
      const newConfig = { ...config, enabled: newEnabled };
      setConfig(newConfig);
      await saveMellowtelConfig(newConfig);
    } catch (err) {
      setError('Failed to toggle Mellowtel');
      console.error('Error toggling Mellowtel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof MellowtelConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveMellowtelConfig(config);
      // Apply the new configuration
      if (config.enabled) {
        await toggleMellowtel(false);
        await toggleMellowtel(true);
      }
    } catch (err) {
      setError('Failed to save Mellowtel settings');
      console.error('Error saving Mellowtel settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Mellowtel Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Enable Bandwidth Sharing
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={handleToggle}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full ${config.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  } relative transition-colors duration-200 ease-in-out`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${config.enabled ? 'transform translate-x-5' : ''
                    }`}></div>
                </div>
              </label>
            </div>

            {/* Max Bandwidth Usage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Bandwidth Usage (MB/day)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={config.maxBandwidthUsage}
                onChange={(e) => handleConfigChange('maxBandwidthUsage', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Share Only When Idle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Share only when idle
              </span>
              <input
                type="checkbox"
                checked={config.shareOnlyWhenIdle}
                onChange={(e) => handleConfigChange('shareOnlyWhenIdle', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {/* Stats Display */}
            {stats && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bandwidth Shared:</span>
                    <p className="font-medium">{stats.bandwidthShared} MB</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Earnings:</span>
                    <p className="font-medium">${stats.earnings.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className={`font-medium ${stats.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {stats.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Update:</span>
                    <p className="font-medium">
                      {(() => {
                        try {
                          return new Date(stats.lastUpdate).toLocaleDateString();
                        } catch (error) {
                          return 'N/A';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Settings
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 mt-4">
              <p className="mb-1">
                💡 Mellowtel allows you to earn passive income by sharing unused bandwidth.
              </p>
              <p>
                Your privacy and security are protected. Only anonymous traffic is routed through your connection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MellowtelSettings;