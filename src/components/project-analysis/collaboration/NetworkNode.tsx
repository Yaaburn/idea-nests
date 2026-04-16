import { memo } from "react";
import { NetworkMember } from "./types";

interface NetworkNodeProps {
  member: NetworkMember;
  x: number;
  y: number;
  isSelected: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  onClick: (memberId: string) => void;
}

const NODE_RADIUS = 28;
const RING_WIDTH = 5;
const RING_RADIUS = NODE_RADIUS + RING_WIDTH / 2 + 2;

const NetworkNode = memo(({
  member,
  x,
  y,
  isSelected,
  isDimmed,
  isHighlighted,
  onClick,
}: NetworkNodeProps) => {
  const circumference = 2 * Math.PI * RING_RADIUS;

  // Build pie-chart ring segments
  let accumulatedOffset = 0;
  const segments = member.projects.map((proj) => {
    const segLen = (proj.percentage / 100) * circumference;
    const gap = 2;
    const offset = accumulatedOffset;
    accumulatedOffset += segLen + gap;
    return { ...proj, segLen: Math.max(segLen - gap, 0), offset };
  });

  const opacity = isDimmed ? 0.2 : 1;
  const scale = isSelected ? 1.15 : isHighlighted ? 1.05 : 1;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{
        opacity,
        transition: "opacity 0.4s ease, transform 0.3s ease",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(member.id);
      }}
    >
      {/* Scale wrapper */}
      <g transform={`scale(${scale})`} style={{ transition: "transform 0.3s ease" }}>
        {/* Selection glow */}
        {isSelected && (
          <circle
            r={RING_RADIUS + 6}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeOpacity={0.4}
          >
            <animate
              attributeName="stroke-opacity"
              values="0.4;0.15;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Pie-chart ring segments */}
        {segments.map((seg, i) => (
          <circle
            key={i}
            r={RING_RADIUS}
            fill="none"
            stroke={seg.color}
            strokeWidth={RING_WIDTH}
            strokeDasharray={`${seg.segLen} ${circumference - seg.segLen}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            transform="rotate(-90)"
          />
        ))}

        {/* Avatar circle background */}
        <circle r={NODE_RADIUS} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />

        {/* Initials */}
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[13px] font-semibold"
          fill="hsl(var(--foreground))"
          style={{ userSelect: "none" }}
        >
          {member.initials}
        </text>

        {/* Active projects badge */}
        {member.projects.length > 1 && (
          <g transform={`translate(${NODE_RADIUS - 4}, ${-NODE_RADIUS + 4})`}>
            <circle r={9} fill="hsl(var(--primary))" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              className="text-[9px] font-bold"
              style={{ userSelect: "none" }}
            >
              {member.projects.length}
            </text>
          </g>
        )}
      </g>

      {/* Name label below */}
      <text
        y={NODE_RADIUS + 20}
        textAnchor="middle"
        className="text-[11px] font-medium"
        fill="hsl(var(--foreground))"
        style={{ opacity, userSelect: "none" }}
      >
        {member.name}
      </text>
      <text
        y={NODE_RADIUS + 33}
        textAnchor="middle"
        className="text-[9px]"
        fill="hsl(var(--muted-foreground))"
        style={{ opacity, userSelect: "none" }}
      >
        {member.role}
      </text>
    </g>
  );
});

NetworkNode.displayName = "NetworkNode";
export default NetworkNode;
