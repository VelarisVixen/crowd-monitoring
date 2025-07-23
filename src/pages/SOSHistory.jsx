
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Trash2, 
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { usePanic } from '@/contexts/PanicContext';
import { toast } from '@/components/ui/use-toast';

const SOSHistory = () => {
  const { panicHistory, clearHistory } = usePanic();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleExportHistory = () => {
    if (panicHistory.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any SOS history to export."
      });
      return;
    }

    // Backend integration hook - export history
    const exportData = {
      exportDate: new Date().toISOString(),
      totalAlerts: panicHistory.length,
      alerts: panicHistory.map(alert => ({
        id: alert.id,
        timestamp: alert.timestamp,
        location: alert.location,
        status: alert.status,
        type: alert.type
      }))
    };

    // Create downloadable file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sos-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "History Exported",
      description: "Your SOS history has been downloaded successfully."
    });
  };

  const handleClearHistory = () => {
    if (panicHistory.length === 0) {
      toast({
        title: "No History to Clear",
        description: "Your SOS history is already empty."
      });
      return;
    }

    clearHistory();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-red-400 bg-red-500/20';
      case 'resolved':
        return 'text-green-400 bg-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Location unavailable';
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const sortedHistory = [...panicHistory].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
  });

  const filteredHistory = sortedHistory.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  return (
    <>
      <Helmet>
        <title>SOS History - SafeGuard</title>
        <meta name="description" content="View and manage your emergency alert history and panic button usage" />
      </Helmet>

      <div className="min-h-screen p-6 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">SOS History</h1>
            <p className="text-white/70 text-sm">
              {panicHistory.length} total alerts sent
            </p>
          </div>
          <div className="flex space-x-2">
            <motion.button
              onClick={handleExportHistory}
              className="p-3 glass rounded-xl hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={20} className="text-white" />
            </motion.button>
            <motion.button
              onClick={handleClearHistory}
              className="p-3 glass rounded-xl hover:bg-red-500/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 size={20} className="text-red-400" />
            </motion.button>
          </div>
        </motion.div>

        {/* Filters and Sort */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-white/60" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="active" className="bg-gray-800">Active</option>
                <option value="resolved" className="bg-gray-800">Resolved</option>
                <option value="pending" className="bg-gray-800">Pending</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-white/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest" className="bg-gray-800">Newest First</option>
                <option value="oldest" className="bg-gray-800">Oldest First</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {panicHistory.filter(a => a.status === 'active').length}
            </div>
            <div className="text-white/60 text-sm">Active</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {panicHistory.filter(a => a.status === 'resolved').length}
            </div>
            <div className="text-white/60 text-sm">Resolved</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {panicHistory.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-white/60 text-sm">Pending</div>
          </div>
        </motion.div>

        {/* History List */}
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={32} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No SOS History</h3>
              <p className="text-white/70">
                {filter === 'all' 
                  ? "You haven't sent any panic alerts yet." 
                  : `No alerts with status "${filter}" found.`
                }
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-4 border border-white/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-white font-semibold">Emergency Alert</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2 text-white/70">
                            <Clock size={14} />
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-white/70">
                            <MapPin size={14} />
                            <span>{formatLocation(alert.location)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        // Backend integration hook - view alert details
                        toast({
                          title: "🚧 Feature Coming Soon",
                          description: "Detailed alert view will be available soon!"
                        });
                      }}
                    >
                      <span className="text-white/40 text-sm">View</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Emergency Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-3xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Emergency Information</h3>
          <div className="space-y-3 text-sm text-white/80">
            <p>• SOS alerts are automatically sent to emergency services and your emergency contacts</p>
            <p>• Your location is shared to help responders find you quickly</p>
            <p>• Keep your emergency contacts updated in Settings</p>
            <p>• In case of immediate danger, call local emergency services directly</p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SOSHistory;
