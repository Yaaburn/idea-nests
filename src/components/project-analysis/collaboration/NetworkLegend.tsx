import { memo } from "react";
import { EDGE_TYPE_CONFIG } from "./types";

const NetworkLegend = memo(() => {
  return (
    <div className="absolute bottom-4 right-4 z-20 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
      <div className="space-y-1.5">
        {Object.entries(EDGE_TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <svg width={24} height={8}>
              <line
                x1={0} y1={4} x2={24} y2={4}
                stroke={cfg.color}
                strokeWidth={2}
                strokeDasharray={cfg.dashArray || "none"}
              />
            </svg>
            <span className="text-[10px] text-foreground">{cfg.label}</span>
          </div>
        ))}
        <div className="border-t border-border pt-1.5 mt-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-primary/50 flex items-center justify-center">
              <span className="text-[6px] font-bold text-primary">2</span>
            </div>
            <span className="text-[10px] text-foreground">Multi-project member</span>
          </div>
        </div>
      </div>
    </div>
  );
});

NetworkLegend.displayName = "NetworkLegend";
export default NetworkLegend;
