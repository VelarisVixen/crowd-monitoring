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
      // Query active alerts from admin-alerts collection
      const alertsQuery = query(
        collection(db, 'admin-alerts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        alertsQuery,
        (snapshot) => {
          setIsConnected(true);

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const alertData = {
                id: change.doc.id,
                ...change.doc.data()
              };

              // Convert Firestore timestamp to ISO string if needed
              if (alertData.createdAt && alertData.createdAt.toDate) {
                alertData.timestamp = alertData.createdAt.toDate().toISOString();
              }

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

      console.log('Connected to Firestore admin-alerts');
      return unsubscribe;

    } catch (error) {
      console.error('Failed to connect to alert service:', error);
      setIsConnected(false);
      return null;
    }
  };





  const handleIncomingAlert = (alertData) => {
    if (!location) return;

    // Calculate distance to alert
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      alertData.location.latitude,
      alertData.location.longitude
    );

    // Check if user is within alert radius
    if (distance <= alertData.radius) {
      setActiveAlert(alertData);
      
      // Add to history
      const updatedHistory = [alertData, ...alertHistory].slice(0, 50); // Keep last 50 alerts
      setAlertHistory(updatedHistory);
      localStorage.setItem('alertHistory', JSON.stringify(updatedHistory));

      // Trigger vibration if available
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      toast({
        title: `⚠️ ${alertData.title}`,
        description: alertData.message,
        variant: "destructive",
        duration: 10000
      });
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

  // Backend integration function - fetch alerts from API
  const fetchAlertsFromAPI = async () => {
    try {
      const response = await fetch('/api/alerts/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          location: location,
          radius: 5000 // 5km radius
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const alerts = await response.json();
      return alerts;
    } catch (error) {
      console.error('Failed to fetch alerts from API:', error);
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
