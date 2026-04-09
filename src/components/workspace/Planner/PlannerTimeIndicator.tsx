import { useState, useEffect } from "react";
import { DAY_START_HOUR, SLOT_HEIGHT } from "./PlannerTypes";

interface Props {
  show: boolean;
}

const PlannerTimeIndicator = ({ show }: Props) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const dayStartMinutes = DAY_START_HOUR * 60;
  const topOffset = ((totalMinutes - dayStartMinutes) / 15) * SLOT_HEIGHT;

  const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top: `${topOffset}px` }}
    >
      {/* Time badge */}
      <div className="absolute -left-[72px] -top-[10px] w-[72px] flex items-center justify-end pr-2">
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {timeStr}
        </span>
      </div>
      {/* Red line */}
      <div className="h-[2px] bg-red-500 w-full relative">
        <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-red-500" />
      </div>
    </div>
  );
};

export default PlannerTimeIndicator;
