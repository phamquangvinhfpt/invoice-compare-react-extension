import React, { useState, useEffect } from 'react';
import {
  openMellowtelSettings,
  checkMellowtelOptInStatus
} from '../services/mellowtelService';

interface MellowtelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component hiển thị thông báo chào mừng khi cài đặt lần đầu
const WelcomeInstallBanner: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            🎉 Welcome to Invoice Compare + Mellowtel!
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            Thank you for installing our extension! You can now set up Mellowtel to support the development and earn money through bandwidth sharing.
          </p>

          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 What is Mellowtel?</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">💰</span>
                Earn money by sharing unused internet bandwidth
              </li>
              <li className="flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">🔒</span>
                100% transparent and privacy-focused
              </li>
              <li className="flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2">⚡</span>
                Support extension development automatically
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-4 w-4 text-yellow-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-yellow-800">
                  <strong>Opt-in Only:</strong> Mellowtel is completely optional. You can enable or disable it at any time through the settings page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onOpenSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              Open Mellowtel Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
const MellowtelSettings: React.FC<MellowtelSettingsProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [isFirstInstall, setIsFirstInstall] = useState(false);
  const [hasOptedIn, setHasOptedIn] = useState(false);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check opt-in status
      const optInData = await checkMellowtelOptInStatus();
      setHasOptedIn(optInData.hasOptedIn);
      setIsFirstInstall(optInData.firstInstall);
    } catch (error) {
      console.error('Error loading Mellowtel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      setLoading(true);
      const result = await openMellowtelSettings();
      if (result.success) {
        console.log('Mellowtel settings opened successfully');
      } else {
        console.error('Failed to open Mellowtel settings:', result.error);
      }
    } catch (error) {
      console.error('Error opening Mellowtel settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mellowtel Settings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your bandwidth sharing preferences and earnings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Welcome Banner for first install */}
              {isFirstInstall && (
                <WelcomeInstallBanner onOpenSettings={handleOpenSettings} />
              )}

              {/* Main Settings Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mellowtel Bandwidth Sharing
                </h3>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Mellowtel allows you to earn money by sharing a small portion of your unused internet bandwidth.
                    All settings are managed through the official Mellowtel settings page.
                  </p>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">📊 Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Completely transparent and open source</li>
                      <li>• Privacy-focused - no personal data collection</li>
                      <li>• Easy opt-in/opt-out at any time</li>
                      <li>• Earn money while using your favorite extensions</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Manage Settings
                      </p>
                      <p className="text-xs text-gray-500">
                        Open the official Mellowtel settings page to configure your preferences
                      </p>
                    </div>
                    <button
                      onClick={handleOpenSettings}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Opening...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                          Open Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Information Section */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">About Mellowtel</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Mellowtel is an open-source, privacy-focused platform that allows extension users to support developers
                      by sharing unused bandwidth. Visit the settings page to learn more and configure your preferences.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MellowtelSettings;