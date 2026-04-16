import { memo } from "react";
import { NodePosition } from "./types";

interface NetworkMinimapProps {
  positions: NodePosition[];
  viewBox: { x: number; y: number; width: number; height: number };
  canvasSize: { width: number; height: number };
}

const MINIMAP_W = 140;
const MINIMAP_H = 90;

const NetworkMinimap = memo(({ positions, viewBox, canvasSize }: NetworkMinimapProps) => {
  const scaleX = MINIMAP_W / canvasSize.width;
  const scaleY = MINIMAP_H / canvasSize.height;

  const vpX = (-viewBox.x) * scaleX;
  const vpY = (-viewBox.y) * scaleY;
  const vpW = viewBox.width * scaleX;
  const vpH = viewBox.height * scaleY;

  return (
    <div className="absolute bottom-4 left-4 z-20 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
      <svg width={MINIMAP_W} height={MINIMAP_H} className="block">
        {/* Background */}
        <rect width={MINIMAP_W} height={MINIMAP_H} fill="hsl(var(--muted))" rx={4} opacity={0.5} />

        {/* Nodes as dots */}
        {positions.map((pos) => (
          <circle
            key={pos.id}
            cx={pos.x * scaleX}
            cy={pos.y * scaleY}
            r={3}
            fill="hsl(var(--primary))"
            opacity={0.8}
          />
        ))}

        {/* Viewport indicator */}
        <rect
          x={Math.max(0, vpX)}
          y={Math.max(0, vpY)}
          width={Math.min(vpW, MINIMAP_W)}
          height={Math.min(vpH, MINIMAP_H)}
          fill="hsl(var(--primary))"
          fillOpacity={0.1}
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
  );
});

NetworkMinimap.displayName = "NetworkMinimap";
export default NetworkMinimap;
