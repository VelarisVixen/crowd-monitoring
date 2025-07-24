import React, { createContext, useContext, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { uploadVideoAndGetURL, saveSOSAlertToFirestore } from '@/lib/firebase';

const PanicContext = createContext();

export const usePanic = () => {
  const context = useContext(PanicContext);
  if (!context) {
    throw new Error('usePanic must be used within a PanicProvider');
  }
  return context;
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let platform = 'unknown';
    if (/android/i.test(ua)) {
        platform = 'android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
        platform = 'ios';
    } else if (/Win/.test(ua)) {
        platform = 'windows';
    } else if (/Mac/.test(ua)) {
        platform = 'macos';
    }

    return {
        platform,
        version: navigator.appVersion,
        model: 'Web Browser'
    };
};

export const PanicProvider = ({ children }) => {
  const [isActivated, setIsActivated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [panicHistory, setPanicHistory] = useState(() => {
    const saved = localStorage.getItem('panicHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const { location, getCurrentLocation } = useLocation();

  const activatePanic = async (message, stream) => {
    setIsProcessing(true);
    try {
      let currentLocation = location;
      if (!currentLocation) {
        toast({ title: "Getting Location...", description: "Please wait while we fetch your precise location." });
        currentLocation = await getCurrentLocation();
      }
      
      let videoData = { videoUrl: null, videoThumbnail: null, videoDuration: 0 };
      if (stream) {
        toast({ title: "Uploading Video...", description: "Your emergency video is being securely uploaded. Please wait." });
        videoData = await uploadVideoAndGetURL(stream, `user_12345`);

        // Stop the camera stream after recording
        stream.getTracks().forEach(track => track.stop());
      }

      const deviceInfo = getDeviceInfo();

      const panicPayload = {
        userId: "user_12345",
        videoUrl: videoData.videoUrl,
        videoThumbnail: videoData.videoThumbnail,
        videoDuration: videoData.videoDuration,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy
        },
        message: message || "Emergency SOS activated - automatic recording",
        deviceInfo: deviceInfo
      };

      // Save to Firestore
      toast({ title: "Saving Alert...", description: "Saving your SOS alert to database..." });
      await saveSOSAlertToFirestore(panicPayload);

      await sendPanicAlertToBackend(panicPayload);

      const panicAlert = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        location: currentLocation,
        status: 'active',
        type: 'panic',
        ...videoData,
        message,
      };

      const updatedHistory = [panicAlert, ...panicHistory];
      setPanicHistory(updatedHistory);
      localStorage.setItem('panicHistory', JSON.stringify(updatedHistory));

      setIsActivated(true);
      toast({
        title: "🚨 Panic Alert Sent!",
        description: "Emergency services have been notified with your video and location.",
        duration: 8000,
      });

      setTimeout(() => {
        setIsActivated(false);
      }, 30000);

    } catch (error) {
      console.error("Panic Activation Error:", error);
      toast({
        title: "Alert Failed",
        description: error.message || "Failed to send panic alert. Please try again.",
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendPanicAlertToBackend = async (payload) => {
    // Backend integration disabled for frontend-only demo
    console.log('SOS Alert data ready for backend:', payload);
    toast({
      title: "Alert Simulated",
      description: "This is a demo app. In production, this would send the alert to emergency services.",
      duration: 5000
    });
    return Promise.resolve();
  };

  const deactivatePanic = () => {
    setIsActivated(false);
  };

  const clearHistory = () => {
    setPanicHistory([]);
    localStorage.removeItem('panicHistory');
    toast({
      title: "History Cleared",
      description: "All panic alert history has been removed."
    });
  };

  const value = {
    isActivated,
    isProcessing,
    setIsProcessing,
    panicHistory,
    activatePanic,
    deactivatePanic,
    clearHistory
  };

  return (
    <PanicContext.Provider value={value}>
      {children}
    </PanicContext.Provider>
  );
};
