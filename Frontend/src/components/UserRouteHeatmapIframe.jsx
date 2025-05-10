import React, { useRef, useState, useEffect } from 'react';

const UserRouteHeatmapIframe = () => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the API URL from environment or fallback
  const API_URI = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  useEffect(() => {
    const handleIframeLoad = () => {
      setLoading(false);
    };

    const handleIframeError = () => {
      setError('Failed to load heatmap');
      setLoading(false);
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
      iframeRef.current.addEventListener('error', handleIframeError);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
        iframeRef.current.removeEventListener('error', handleIframeError);
      }
    };
  }, []);
  
  return (
    <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <div className="text-gray-700 text-center bg-white p-4 rounded-lg shadow-md">
            Loading your travel routes...
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <div className="text-red-600 text-center bg-white p-4 rounded-lg shadow-md">
            {error}
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={`${API_URI}/api/user/heatmap`}
        className="w-full h-full border-0"
        title="User Route Heatmap"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default UserRouteHeatmapIframe;