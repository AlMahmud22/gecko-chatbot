import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ThinkingIndicator() {
  const [logs, setLogs] = useState([]);
  const [isListenerActive, setIsListenerActive] = useState(false);

  useEffect(() => {
    // Listen for inference logs from backend
    const handleLog = (event, log) => {
      console.log('[ThinkingIndicator] Received log:', log);
      setLogs((prev) => {
        // Filter out consecutive duplicates
        if (prev.length > 0 && prev[prev.length - 1] === log) {
          return prev; // Skip duplicate
        }
        const newLogs = [...prev, log];
        // Keep only last 10 logs for better readability
        return newLogs.slice(-10);
      });
    };

    // Setup listener
    if (window.electronAPI && window.electron) {
      console.log('[ThinkingIndicator] Setting up inference-log listener');
      window.electron.ipcRenderer.on('inference-log', handleLog);
      setIsListenerActive(true);
    } else {
      console.warn('[ThinkingIndicator] electron or electronAPI not available');
    }

    return () => {
      // Cleanup listener
      if (window.electronAPI && window.electron) {
        console.log('[ThinkingIndicator] Removing inference-log listener');
        window.electron.ipcRenderer.removeListener('inference-log', handleLog);
      }
      // Clear logs on unmount
      setLogs([]);
      setIsListenerActive(false);
    };
  }, []);

  return (
    <div className="message-wrapper p-6 w-full">
      <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-[#2a2a2a] shadow-xl w-full">
        <div className="flex items-center gap-4 mb-4">
          {/* Animated dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-green-600 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
          
          <span className="text-gray-300 font-medium">
            {logs.length > 0 ? 'Processing...' : 'Generating response...'}
          </span>
        </div>
        
        {/* Real-time logs display */}
        {logs.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {logs.map((log, index) => (
                <motion.div
                  key={`${index}-${log}`}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-400 text-sm px-3 py-2 bg-[#252525] rounded-lg border border-[#333333]"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Debug info - remove in production */}
        {!isListenerActive && (
          <div className="mt-2 text-xs text-red-400">
            ⚠️ Listener not active
          </div>
        )}
      </div>
    </div>
  );
}

export default ThinkingIndicator;
