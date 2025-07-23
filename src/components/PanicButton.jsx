import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { usePanic } from '@/contexts/PanicContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const PanicButton = () => {
  const { isActivated, activatePanic, isProcessing, setIsProcessing } = usePanic();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handlePanicPress = () => {
    if (isActivated || isProcessing) return;
    setShowConfirmation(true);
  };

  useEffect(() => {
    if (showConfirmation) {
      setIsProcessing(true);
      const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera/Mic permission denied:", err);
          toast({
            title: "Permission Denied",
            description: "Camera and microphone access is required. Please enable permissions in your browser settings.",
            variant: "destructive",
            duration: 8000
          });
          setShowConfirmation(false);
        } finally {
          setIsProcessing(false);
        }
      };
      getMedia();
    } else {
      // Cleanup stream when dialog is closed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [showConfirmation, setIsProcessing]);

  const confirmPanic = async () => {
    await activatePanic(message, streamRef.current);
    setShowConfirmation(false); // This will trigger cleanup in useEffect
  };

  const cancelPanic = () => {
    setShowConfirmation(false); // This will trigger cleanup in useEffect
  };

  return (
    <>
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
              {isProcessing ? <Loader2 size={24} className="text-white animate-spin" /> : <AlertTriangle size={24} className="text-white" />}
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
              {isActivated ? 'Alert Sent!' : isProcessing ? 'Starting...' : 'SOS'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="glass-dark text-white border-purple-400/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="text-red-400" />
              <span>Confirm SOS Alert</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              You are about to send an emergency alert. A live video recording has started. Please describe the situation below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
             <video ref={videoRef} className="w-full rounded-lg bg-black" muted autoPlay playsInline />
             <div className="flex items-center text-red-400 text-sm mt-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                 Recording...
             </div>
          </div>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Describe the emergency..."
            className="w-full p-2 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="3"
          />

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPanic} className="bg-transparent text-white/70 border-white/20 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPanic} className="bg-red-500 hover:bg-red-600 text-white" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Alert Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PanicButton;