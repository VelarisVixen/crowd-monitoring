
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';

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

  // WebSocket connection for real-time alerts
  useEffect(() => {
    connectToAlertService();
    
    return () => {
      disconnectFromAlertService();
    };
  }, []);

  // Backend integration function - WebSocket connection
  const connectToAlertService = () => {
    try {
      // Placeholder for WebSocket connection
      // Replace with actual WebSocket endpoint
      const wsUrl = 'wss://your-backend.com/alerts';
      
      // For demo purposes, simulate connection
      setIsConnected(true);
      
      // Simulate receiving alerts every 30 seconds for demo
      const interval = setInterval(() => {
        if (Math.random() > 0.8) { // 20% chance of alert
          simulateIncomingAlert();
        }
      }, 30000);

      return () => clearInterval(interval);
      
      /* Actual WebSocket implementation:
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to alert service');
      };
      
      ws.onmessage = (event) => {
        const alertData = JSON.parse(event.data);
        handleIncomingAlert(alertData);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from alert service');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      */
      
    } catch (error) {
      console.error('Failed to connect to alert service:', error);
      setIsConnected(false);
    }
  };

  const disconnectFromAlertService = () => {
    setIsConnected(false);
    // Close WebSocket connection here
  };

  // Simulate incoming alert for demo
  const simulateIncomingAlert = () => {
    if (!location) return;

    const alertTypes = ['fire', 'violence', 'medical', 'evacuation'];
    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    const mockAlert = {
      id: Date.now().toString(),
      type: randomType,
      severity: 'high',
      title: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Alert`,
      message: `Emergency situation reported in your area. Please stay alert and follow safety protocols.`,
      location: {
        latitude: location.latitude + (Math.random() - 0.5) * 0.01,
        longitude: location.longitude + (Math.random() - 0.5) * 0.01
      },
      radius: 500, // meters
      timestamp: new Date().toISOString(),
      source: 'emergency_services'
    };

    handleIncomingAlert(mockAlert);
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
