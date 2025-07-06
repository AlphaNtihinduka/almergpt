/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { RefreshCw, AlertTriangle, Crown, Zap, Wifi, WifiOff } from "lucide-react";
import { useRequestStatus } from "@/hooks/useRequestStatus";
import { useState, useEffect } from "react";

const RequestFooter = () => {
  const { requestStatus, loading, error, refreshStatus } = useRequestStatus();
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        iconColor: 'from-gray-500 to-gray-600',
        title: 'Offline',
        subtitle: 'Check your connection',
        statusColor: 'bg-gray-500',
        animate: 'animate-pulse'
      };
    }

    if (loading) {
      return {
        icon: RefreshCw,
        iconColor: 'from-blue-500 to-blue-600',
        title: 'Loading...',
        subtitle: 'Checking status',
        statusColor: 'bg-blue-500',
        animate: 'animate-spin'
      };
    }

    if (error) {
      return {
        icon: AlertTriangle,
        iconColor: 'from-red-500 to-red-600',
        title: 'Error',
        subtitle: error,
        statusColor: 'bg-red-500',
        animate: 'animate-pulse'
      };
    }

    if (!requestStatus) {
      return {
        icon: AlertTriangle,
        iconColor: 'from-gray-500 to-gray-600',
        title: 'No Data',
        subtitle: 'Status unavailable',
        statusColor: 'bg-gray-500',
        animate: 'animate-pulse'
      };
    }

    // If user has premium/unlimited access
    if (requestStatus.status && requestStatus.remainingRequests > 3) {
      return {
        icon: Crown,
        iconColor: 'from-yellow-500 to-amber-600',
        title: 'Premium',
        subtitle: `${requestStatus.remainingRequests} requests left`,
        statusColor: 'bg-yellow-500',
        animate: 'animate-pulse'
      };
    }

    // If user can make requests
    if (requestStatus.canMakeRequest) {
      return {
        icon: Zap,
        iconColor: 'from-green-500 to-emerald-600',
        title: 'Active',
        subtitle: `${requestStatus.remainingRequests} requests remaining`,
        statusColor: 'bg-green-500',
        animate: 'animate-pulse'
      };
    }

    // If user has reached limit
    return {
      icon: AlertTriangle,
      iconColor: 'from-orange-500 to-red-600',
      title: 'Limit Reached',
      subtitle: 'Subscribe for more',
      statusColor: 'bg-orange-500',
      animate: 'animate-pulse'
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className="p-4 border-t border-slate-700/50">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30">
        {/* Status indicator */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${statusInfo.iconColor}`}>
          <IconComponent className={`w-4 h-4 text-white ${statusInfo.animate}`} />
        </div>

        {/* Status info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">{statusInfo.title}</div>
          <div className="text-xs text-slate-400 truncate">
            {statusInfo.subtitle}
          </div>
        </div>

        {/* Online/Offline indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <div className={`w-2 h-2 rounded-full ${statusInfo.statusColor} ${statusInfo.animate}`}></div>
        </div>
      </div>

      {/* Show retry button on error */}
      {error && (
        <div className="mt-2 px-3">
          <button
            onClick={refreshStatus}
            className="text-xs text-slate-400 hover:text-slate-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Request count progress bar */}
      {requestStatus && !loading && (
        <div className="mt-2 px-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Requests Used</span>
            <span>{requestStatus.requestCount}/5</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(requestStatus.requestCount / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      <div className="mt-2 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500">Live updates</span>
        </div>
        {requestStatus && (
          <span className="text-xs text-slate-500">
            Updated {new Date().toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default RequestFooter;