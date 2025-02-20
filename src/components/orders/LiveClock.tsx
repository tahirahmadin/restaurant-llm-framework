import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg shadow-md">
      <Clock className="w-5 h-5 text-red-600" />
      <div className="text-red-800 font-semibold text-sm">
        {now.toLocaleDateString()} |{" "}
        {now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
    </div>
  );
};
