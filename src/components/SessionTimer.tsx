import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  startTime: number;
  duration?: number; // in ms, default 1 hour
}

export const SessionTimer = ({ startTime, duration = 7200000 }: SessionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / duration) * 100;
  const isLow = percentage < 20;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className={`h-4 w-4 ${isLow ? 'text-destructive' : 'text-muted-foreground'}`} />
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 rounded-full ${isLow ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`font-mono text-xs ${isLow ? 'text-destructive' : 'text-muted-foreground'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};
