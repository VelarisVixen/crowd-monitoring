import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const DangerAlertContext = createContext();

export const useDangerAlert = () => {
  const context = useContext(DangerAlertContext);
  if (!context) {
    throw new Error('useDangerAlert must be used within a DangerAlertProvider');
  }
  return context;
};

export const DangerAlertProvider = ({ children }) => {
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertHistory, setAlertHistory] = useState(() => {
    const saved = localStorage.getItem('alertHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isConnected, setIsConnected] = useState(false);
  const { location } = useLocation();

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Firestore real-time listener for admin alerts
  useEffect(() => {
    const unsubscribe = connectToAlertService();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [location]);

  // Firestore real-time listener for admin alerts
  const connectToAlertService = () => {
    if (!location) {
      setIsConnected(false);
      return null;
    }

    try {
      // Query active alerts from alerts collection
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('isActive', '==', true)
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        alertsQuery,
        (snapshot) => {
          setIsConnected(true);

          // Get all documents and sort them client-side
          const allAlerts = [];
          snapshot.docs.forEach((doc) => {
            const alertData = {
              id: doc.id,
              ...doc.data()
            };

            // Convert Firestore timestamp to ISO string if needed
            if (alertData.createdAt && alertData.createdAt.toDate) {
              alertData.timestamp = alertData.createdAt.toDate().toISOString();
            }

            allAlerts.push(alertData);
          });

          // Sort by creation time (newest first)
          allAlerts.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(a.timestamp || 0);
            const timeB = b.createdAt?.toDate?.() || new Date(b.timestamp || 0);
            return timeB - timeA;
          });

          // Check for new alerts by comparing with current history
          allAlerts.forEach((alertData) => {
            const existsInHistory = alertHistory.some(alert => alert.id === alertData.id);
            if (!existsInHistory) {
              console.log('New admin alert received:', alertData);
              handleIncomingAlert(alertData);
            }
          });
        },
        (error) => {
          console.error('Error listening to admin alerts:', error);
          setIsConnected(false);
          toast({
            title: "Connection Error",
            description: "Failed to connect to alert service.",
            variant: "destructive"
          });
        }
      );

      console.log('Connected to Firestore alerts collection');
      return unsubscribe;

    } catch (error) {
      console.error('Failed to connect to alert service:', error);
      setIsConnected(false);
      return null;
    }
  };





  const handleIncomingAlert = (alertData) => {
    if (!location || !alertData.location) {
      console.log('Missing location data:', { userLocation: location, alertLocation: alertData.location });
      return;
    }

    // Calculate distance to alert
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      alertData.location.latitude,
      alertData.location.longitude
    );

    console.log('Alert distance check:', {
      alertId: alertData.id,
      alertTitle: alertData.title,
      distance: Math.round(distance),
      radius: alertData.radius,
      userLocation: { lat: location.latitude, lng: location.longitude },
      alertLocation: { lat: alertData.location.latitude, lng: alertData.location.longitude },
      withinRadius: distance <= (alertData.radius || 1000)
    });

    // Check if user is within alert radius (or force show for testing)
    const withinRadius = distance <= (alertData.radius || 1000);

    // For testing purposes, show alerts even if outside radius but increase radius for admin alerts
    const shouldShow = withinRadius || alertData.source === 'admin_panel';

    if (shouldShow) {
      setActiveAlert(alertData);

      // Add to history
      setAlertHistory(prevHistory => {
        // Check if alert already exists to avoid duplicates
        const exists = prevHistory.some(alert => alert.id === alertData.id);
        if (exists) return prevHistory;

        const updatedHistory = [alertData, ...prevHistory].slice(0, 50); // Keep last 50 alerts
        localStorage.setItem('alertHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

      // Trigger vibration if available
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // Show notification
      toast({
        title: `⚠️ ${alertData.title || 'Emergency Alert'}`,
        description: `${alertData.message || 'Emergency situation in your area'} (${Math.round(distance)}m away)`,
        variant: alertData.severity === 'low' ? "default" : "destructive",
        duration: 10000
      });

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`⚠️ ${alertData.title || 'Emergency Alert'}`, {
          body: alertData.message || 'Emergency situation in your area',
          icon: '/icon-192x192.png',
          tag: alertData.id
        });
      }
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const clearAlertHistory = () => {
    setAlertHistory([]);
    localStorage.removeItem('alertHistory');
    toast({
      title: "Alert History Cleared",
      description: "All alert history has been removed."
    });
  };

  // Fetch alerts from Firestore (for manual refresh)
  const fetchAlertsFromAPI = async () => {
    try {
      // The real-time listener handles this automatically
      // This function is kept for manual refresh compatibility
      console.log('Manual refresh triggered - alerts are updated in real-time');
      return alertHistory;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  };

  const value = {
    activeAlert,
    alertHistory,
    isConnected,
    dismissAlert,
    clearAlertHistory,
    fetchAlertsFromAPI
  };

  return (
    <DangerAlertContext.Provider value={value}>
      {children}
    </DangerAlertContext.Provider>
  );
};
