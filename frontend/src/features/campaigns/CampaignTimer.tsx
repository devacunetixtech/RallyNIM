import React, { useState, useEffect } from 'react';
import { Clock, Hourglass, Calendar } from 'lucide-react';

interface CampaignTimerProps {
  startDate: string | Date;
  endDate: string | Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'upcoming' | 'active' | 'ended';
}

function calculateTimeRemaining(start: string | Date, end: string | Date): TimeRemaining {
  const now = new Date().getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  let diff = 0;
  let status: 'upcoming' | 'active' | 'ended' = 'ended';

  if (now < startTime) {
    diff = startTime - now;
    status = 'upcoming';
  } else if (now >= startTime && now <= endTime) {
    diff = endTime - now;
    status = 'active';
  } else {
    diff = 0;
    status = 'ended';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, status };
}

export const CampaignTimer: React.FC<CampaignTimerProps> = ({ startDate, endDate }) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining(startDate, endDate));

  useEffect(() => {
    setTimeLeft(calculateTimeRemaining(startDate, endDate));

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(startDate, endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const { days, hours, minutes, seconds, status } = timeLeft;

  if (status === 'ended') {
    return (
      <div className="flex items-center gap-3">
        <Hourglass size={18} className="text-rose-400 shrink-0" />
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Campaign Status</div>
          <div className="text-xs font-semibold text-rose-400">Campaign Ended</div>
        </div>
      </div>
    );
  }

  const renderTimerBlock = (value: number, label: string) => (
    <span className="inline-flex items-baseline">
      <span className="font-mono font-extrabold text-slate-200 tabular-nums">{value.toString().padStart(2, '0')}</span>
      <span className="text-[10px] text-slate-500 font-bold lowercase ml-0.5 mr-1.5">{label}</span>
    </span>
  );

  return (
    <div className="flex items-center gap-3">
      {status === 'upcoming' ? (
        <Calendar size={18} className="text-blue-400 shrink-0" />
      ) : (
        <Clock size={18} className="text-emerald-400 shrink-0 animate-pulse" />
      )}
      <div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {status === 'upcoming' ? 'Starts In' : 'Time Remaining'}
        </div>
        <div className="text-xs font-semibold text-slate-300">
          {days > 0 && renderTimerBlock(days, 'd')}
          {renderTimerBlock(hours, 'h')}
          {renderTimerBlock(minutes, 'm')}
          {renderTimerBlock(seconds, 's')}
        </div>
      </div>
    </div>
  );
};
