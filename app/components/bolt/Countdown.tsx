"use client";

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  expiry: string;
}

const Countdown: React.FC<CountdownProps> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference: number = new Date(expiry).getTime() - Date.now();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        return `${days}d ${hours}h ${minutes}m`;
      }
      return 'Expired';
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);

    return () => clearInterval(timer);
  }, [expiry]);

  return <span>{timeLeft}</span>;
};

export default Countdown;