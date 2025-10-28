import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SettingsChat from '../components/Settings/SettingsChat';
import SettingsPerformance from '../components/Settings/SettingsPerformance';
import SettingsSystem from '../components/Settings/SettingsSystem';
import PrivacyDisclaimer from '../components/Settings/PrivacyDisclaimer';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import './SettingsPage.css';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', label: 'Chat', component: <SettingsChat /> },
    { id: 'performance', label: 'Performance', component: <SettingsPerformance /> },
    { id: 'system', label: 'System', component: <SettingsSystem /> },
  ];

  return (
    <motion.div
      className="settings-page p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-6">
        <Cog6ToothIcon className="w-8 h-8 text-green-500 mr-2" />
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
      </div>
      
      <PrivacyDisclaimer />
      <div className="tabs flex mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="tab-content"
      >
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </motion.div>
    </motion.div>
  );
}

export default SettingsPage;