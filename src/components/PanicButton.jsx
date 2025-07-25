import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Loader2, Video } from 'lucide-react';
import { usePanic } from '@/contexts/PanicContext';
import { toast } from '@/components/ui/use-toast';

const PanicButton = () => {
  const { isActivated, activatePanic, isProcessing, setIsProcessing } = usePanic();
  const streamRef = useRef(null);

  const handlePanicPress = async () => {
    if (isActivated || isProcessing) return;

    setIsProcessing(true);

    try {
      // Show immediate feedback
      toast({
        title: "🚨 SOS Activated",
        description: "Recording 5-second emergency video...",
        duration: 3000
      });

      // Get camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      streamRef.current = stream;

      // Start automatic recording and upload
      await activatePanic("Emergency SOS activated - automatic recording", streamRef.current);

    } catch (err) {
      console.error("Camera/Mic permission denied:", err);
      toast({
        title: "Permission Denied",
        description: "Camera and microphone access is required for emergency recording.",
        variant: "destructive",
        duration: 8000
      });
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      className="fixed bottom-24 right-6 z-50"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <AnimatePresence mode="wait">
        {isActivated ? (
          <motion.div
            key="activated"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center glass border-2 border-green-400"
          >
            <Check size={24} className="text-white" />
          </motion.div>
        ) : (
          <motion.button
            key="panic"
            onClick={handlePanicPress}
            disabled={isProcessing}
            className={`w-16 h-16 bg-red-500 rounded-full flex items-center justify-center glass border-2 border-red-400 transition-all duration-300 ${
              isProcessing ? 'cursor-not-allowed' : 'hover:scale-105'
            } ${isActivated ? '' : 'panic-pulse'}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Video size={20} className="text-white animate-pulse" />
                <div className="text-xs text-white mt-1">REC</div>
              </div>
            ) : (
              <AlertTriangle size={24} className="text-white" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute -left-20 top-1/2 transform -translate-y-1/2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="glass-dark px-3 py-1 rounded-lg">
          <span className="text-xs text-white font-medium">
            {isActivated ? 'Alert Sent!' : isProcessing ? 'Recording...' : 'SOS'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PanicButton;
