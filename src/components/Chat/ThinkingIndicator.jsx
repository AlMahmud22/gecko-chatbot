import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ThinkingIndicator() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Listen for inference logs from backend
    const handleLog = (event, log) => {
      setLogs((prev) => {
        // Filter out consecutive duplicates
        if (prev.length > 0 && prev[prev.length - 1] === log) {
          return prev; // Skip duplicate
        }
        const newLogs = [...prev, log];
        // Keep only last 8 logs
        return newLogs.slice(-8);
      });
    };

    // Setup listener
    if (window.electronAPI && window.electron) {
      window.electron.ipcRenderer.on('inference-log', handleLog);
    }

    return () => {
      // Cleanup listener
      if (window.electronAPI && window.electron) {
        window.electron.ipcRenderer.removeListener('inference-log', handleLog);
      }
      // Clear logs on unmount
      setLogs([]);
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
            Processing...
          </span>
        </div>
        
        {/* Real-time logs */}
        {logs.length > 0 && (
          <div className="space-y-1 font-mono text-xs">
            <AnimatePresence mode="popLayout">
              {logs.map((log, index) => (
                <motion.div
                  key={`${index}-${log}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400 truncate"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThinkingIndicator;
