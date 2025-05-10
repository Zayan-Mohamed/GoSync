import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

const PaymentTimer = ({ createdAt }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    if (!createdAt) {
      setIsExpired(true);
      return;
    }
    
    const calculateTimeRemaining = () => {
      const bookingTime = new Date(createdAt).getTime();
      const deadline = bookingTime + 6 * 60 * 60 * 1000; // 6 hours in milliseconds
      const now = new Date().getTime();
      const remaining = deadline - now;
      
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        return null;
      } else {
        setTimeRemaining(Math.floor(remaining / 1000)); // Convert to seconds
        return remaining;
      }
    };
    
    // Calculate initial time remaining
    const initialRemaining = calculateTimeRemaining();
    
    // If already expired or no valid date, don't set up interval
    if (initialRemaining === null) return;
    
    // Update every minute
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (remaining === null) {
        clearInterval(interval);
      }
    }, 60000); // 1 minute
    
    // Update more frequently as we get closer to deadline
    if (initialRemaining < 15 * 60 * 1000) { // Less than 15 minutes left
      clearInterval(interval);
      const urgentInterval = setInterval(() => {
        const remaining = calculateTimeRemaining();
        if (remaining === null) {
          clearInterval(urgentInterval);
        }
      }, 10000); // 10 seconds
      
      return () => clearInterval(urgentInterval);
    }
    
    return () => clearInterval(interval);
  }, [createdAt]);
  
  const formatTimeRemaining = () => {
    if (isExpired) return "Expired";
    if (timeRemaining === null) return "Calculating...";
    
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  };
  
  const getProgressPercentage = () => {
    if (isExpired || timeRemaining === null) return 100;
    
    const totalTime = 6 * 60 * 60; // 6 hours in seconds
    const elapsedTime = totalTime - timeRemaining;
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  };
  
  const progressPercentage = getProgressPercentage();
  
  return (
    <div className="mt-2">
      <div className="flex items-center mb-1">
        <Clock size={14} className="mr-1 text-yellow-600" />
        <span className="text-xs font-medium text-yellow-700">
          Payment deadline:
        </span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${isExpired ? 'bg-red-500' : progressPercentage > 75 ? 'bg-red-500' : progressPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs font-medium text-gray-600">
          {formatTimeRemaining()}
        </span>
        
        {isExpired && (
          <div className="flex items-center">
            <AlertCircle size={12} className="text-red-500 mr-1" />
            <span className="text-xs text-red-500">Payment window closed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTimer;
