import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { DangerAlertProvider } from '@/contexts/DangerAlertContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { PanicProvider } from '@/contexts/PanicContext';
import Navigation from '@/components/Navigation';
import PanicButton from '@/components/PanicButton';
import DangerAlert from '@/components/DangerAlert';
import Home from '@/pages/Home';
import AlertFeed from '@/pages/AlertFeed';
import Settings from '@/pages/Settings';
import SOSHistory from '@/pages/SOSHistory.jsx';

function App() {
  return (
    <Router>
      <Helmet>
        <title>SafeGuard - Crowd Safety App</title>
        <meta name="description" content="Modern crowd safety app with real-time alerts and emergency features" />
      </Helmet>
      
      <LocationProvider>
        <PanicProvider>
          <DangerAlertProvider>
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl floating"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl floating" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl floating" style={{animationDelay: '2s'}}></div>
              </div>

              <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 pb-20">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/alerts" element={<AlertFeed />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/history" element={<SOSHistory />} />
                  </Routes>
                </main>
                
                <Navigation />
                <PanicButton />
                <DangerAlert />
              </div>
              
              <Toaster />
            </div>
          </DangerAlertProvider>
        </PanicProvider>
      </LocationProvider>
    </Router>
  );
}

export default App;