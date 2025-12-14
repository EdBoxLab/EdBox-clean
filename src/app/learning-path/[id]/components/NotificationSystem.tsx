'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, CheckCircle, Trophy, AlertCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: 'unlock' | 'mastery' | 'xp' | 'error' | 'info';
  message: string;
  skillId?: string;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
}

export default function NotificationSystem({ notifications, onRemoveNotification }: NotificationSystemProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ zIndex: 1000 - index }}
            className={`bg-gray-800 border rounded-lg p-4 shadow-2xl max-w-sm backdrop-blur-sm ${
              notification.type === 'unlock' ? 'border-indigo-500 bg-indigo-500/10' :
              notification.type === 'mastery' ? 'border-green-500 bg-green-500/10' :
              notification.type === 'error' ? 'border-red-500 bg-red-500/10' :
              notification.type === 'info' ? 'border-blue-500 bg-blue-500/10' :
              'border-yellow-500 bg-yellow-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'unlock' ? 'bg-indigo-500' :
                  notification.type === 'mastery' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  notification.type === 'info' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
              >
                {notification.type === 'unlock' && <Target className="w-4 h-4 text-white" />}
                {notification.type === 'mastery' && <CheckCircle className="w-4 h-4 text-white" />}
                {notification.type === 'xp' && <Trophy className="w-4 h-4 text-white" />}
                {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
                {notification.type === 'info' && <Info className="w-4 h-4 text-white" />}
              </motion.div>
              <div className="flex-1">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white text-sm font-medium"
                >
                  {notification.message}
                </motion.p>
                {notification.type === 'unlock' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-gray-300 mt-1"
                  >
                    Click to start practicing!
                  </motion.p>
                )}
              </div>
              <button
                onClick={() => onRemoveNotification(notification.id)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className={`h-full ${
                  notification.type === 'unlock' ? 'bg-indigo-500' :
                  notification.type === 'mastery' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  notification.type === 'info' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}