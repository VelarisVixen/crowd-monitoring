
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  Bell, 
  MapPin, 
  Shield, 
  Globe, 
  Moon, 
  Volume2, 
  Smartphone,
  Users,
  HelpCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Settings = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      notifications: true,
      locationSharing: true,
      emergencyContacts: true,
      language: 'en',
      darkMode: true,
      soundAlerts: true,
      vibration: true,
      autoShare: false
    };
  });

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved."
    });
  };

  const settingSections = [
    {
      title: 'Alerts & Notifications',
      icon: Bell,
      settings: [
        {
          key: 'notifications',
          label: 'Push Notifications',
          description: 'Receive safety alerts and emergency notifications',
          type: 'toggle'
        },
        {
          key: 'soundAlerts',
          label: 'Sound Alerts',
          description: 'Play sound for emergency notifications',
          type: 'toggle'
        },
        {
          key: 'vibration',
          label: 'Vibration',
          description: 'Vibrate device for urgent alerts',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Location & Privacy',
      icon: MapPin,
      settings: [
        {
          key: 'locationSharing',
          label: 'Location Sharing',
          description: 'Share your location for safety monitoring',
          type: 'toggle'
        },
        {
          key: 'autoShare',
          label: 'Auto-Share in Emergency',
          description: 'Automatically share location during panic alerts',
          type: 'toggle'
        }
      ]
    },
    {
      title: 'Emergency Contacts',
      icon: Users,
      settings: [
        {
          key: 'emergencyContacts',
          label: 'Emergency Contacts',
          description: 'Manage your emergency contact list',
          type: 'action',
          action: () => {
            toast({
              title: "🚧 Feature Coming Soon",
              description: "Emergency contacts management will be available in the next update!"
            });
          }
        }
      ]
    },
    {
      title: 'App Preferences',
      icon: Smartphone,
      settings: [
        {
          key: 'language',
          label: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' }
          ]
        },
        {
          key: 'darkMode',
          label: 'Dark Mode',
          description: 'Use dark theme for better visibility',
          type: 'toggle'
        }
      ]
    }
  ];

  const ToggleSwitch = ({ enabled, onChange }) => (
    <motion.button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-white/20'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full"
        animate={{ x: enabled ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.button>
  );

  return (
    <>
      <Helmet>
        <title>Settings - SafeGuard</title>
        <meta name="description" content="Customize your SafeGuard app preferences and safety settings" />
      </Helmet>

      <div className="min-h-screen p-6 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Customize your safety preferences</p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="glass rounded-3xl p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <SectionIcon size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>

                <div className="space-y-4">
                  {section.settings.map((setting, settingIndex) => (
                    <motion.div
                      key={setting.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (sectionIndex * 0.1) + (settingIndex * 0.05) }}
                      className="flex items-center justify-between p-4 glass-dark rounded-2xl"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{setting.label}</h3>
                        <p className="text-white/60 text-sm">{setting.description}</p>
                      </div>

                      <div className="ml-4">
                        {setting.type === 'toggle' && (
                          <ToggleSwitch
                            enabled={settings[setting.key]}
                            onChange={(value) => updateSetting(setting.key, value)}
                          />
                        )}

                        {setting.type === 'select' && (
                          <select
                            value={settings[setting.key]}
                            onChange={(e) => updateSetting(setting.key, e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {setting.options.map((option) => (
                              <option key={option.value} value={option.value} className="bg-gray-800">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {setting.type === 'action' && (
                          <motion.button
                            onClick={setting.action}
                            className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Manage
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Help & Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 glass rounded-3xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <HelpCircle size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Help & Support</h2>
          </div>

          <div className="space-y-3">
            <motion.button
              className="w-full p-4 glass-dark rounded-2xl text-left hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                toast({
                  title: "🚧 Coming Soon",
                  description: "Help documentation will be available soon!"
                });
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Help Center</span>
                <span className="text-white/40">→</span>
              </div>
            </motion.button>

            <motion.button
              className="w-full p-4 glass-dark rounded-2xl text-left hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                toast({
                  title: "🚧 Coming Soon",
                  description: "Contact support will be available soon!"
                });
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Contact Support</span>
                <span className="text-white/40">→</span>
              </div>
            </motion.button>

            <motion.button
              className="w-full p-4 glass-dark rounded-2xl text-left hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                toast({
                  title: "🚧 Coming Soon",
                  description: "Privacy policy will be available soon!"
                });
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Privacy Policy</span>
                <span className="text-white/40">→</span>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-white/40 text-sm">SafeGuard v1.0.0</p>
        </motion.div>
      </div>
    </>
  );
};

export default Settings;
