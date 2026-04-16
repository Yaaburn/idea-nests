import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { NetworkMember, NetworkEdge, NodePosition, EDGE_TYPE_CONFIG, EdgeInteraction, TaskFilter } from "./types";
import NetworkNode from "./NetworkNode";
import NetworkMinimap from "./NetworkMinimap";
import NetworkLegend from "./NetworkLegend";
import EdgeDrawer from "./EdgeDrawer";
import { mockMembers, mockEdges, mockPositions, mockTasks, mockProjects } from "./mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CANVAS_W = 900;
const CANVAS_H = 700;

const NetworkCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeInteraction | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Derive which members are relevant based on filters
  const { visibleMemberIds, visibleEdges, dimmedMemberIds } = useMemo(() => {
    const hasTaskFilter = selectedTaskIds.length > 0;
    const hasNodeSelection = selectedNodeId !== null;

    if (!hasTaskFilter && !hasNodeSelection) {
      return {
        visibleMemberIds: new Set(mockMembers.map((m) => m.id)),
        visibleEdges: mockEdges,
        dimmedMemberIds: new Set<string>(),
      };
    }

    let relevantEdges = mockEdges;
    let highlightedIds = new Set<string>();

    // Filter by tasks first
    if (hasTaskFilter) {
      relevantEdges = mockEdges.filter((e) =>
        e.taskIds.some((tid) => selectedTaskIds.includes(tid))
      );
      relevantEdges.forEach((e) => {
        highlightedIds.add(e.fromId);
        highlightedIds.add(e.toId);
      });
    }

    // If a node is selected, further filter to show only that node's connections
    if (hasNodeSelection) {
      const nodeEdges = relevantEdges.filter(
        (e) => e.fromId === selectedNodeId || e.toId === selectedNodeId
      );
      // If task filter produced no edges for this node, fall back to all edges for the node
      const edgesToUse = nodeEdges.length > 0 ? nodeEdges : mockEdges.filter(
        (e) => e.fromId === selectedNodeId || e.toId === selectedNodeId
      );
      highlightedIds = new Set<string>();
      highlightedIds.add(selectedNodeId!);
      edgesToUse.forEach((e) => {
        highlightedIds.add(e.fromId);
        highlightedIds.add(e.toId);
      });
      relevantEdges = edgesToUse;
    }

    const allIds = new Set(mockMembers.map((m) => m.id));
    const dimmed = new Set<string>();
    allIds.forEach((id) => {
      if (!highlightedIds.has(id)) dimmed.add(id);
    });

    return {
      visibleMemberIds: allIds,
      visibleEdges: relevantEdges,
      dimmedMemberIds: dimmed,
    };
  }, [selectedNodeId, selectedTaskIds]);

  const handleNodeClick = useCallback((memberId: string) => {
    setSelectedEdge(null);
    setSelectedNodeId((prev) => (prev === memberId ? null : memberId));
  }, []);

  const handleEdgeClick = useCallback(
    (edge: NetworkEdge) => {
      const from = mockMembers.find((m) => m.id === edge.fromId)!;
      const to = mockMembers.find((m) => m.id === edge.toId)!;
      setSelectedEdge({ edge, fromMember: from, toMember: to });
    },
    []
  );

  const handleCanvasClick = useCallback(() => {
    if (!isPanning) {
      setSelectedNodeId(null);
      setSelectedEdge(null);
    }
  }, [isPanning]);

  const handleTaskToggle = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((t) => t !== taskId) : [...prev, taskId]
    );
    setSelectedNodeId(null);
    setSelectedEdge(null);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTaskIds([]);
    setSelectedNodeId(null);
    setSelectedEdge(null);
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as SVGElement).tagName === "rect") {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(3, Math.max(0.3, prev - e.deltaY * 0.001)));
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(3, z + 0.2));
  const zoomOut = () => setZoom((z) => Math.max(0.3, z - 0.2));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const containerRect = containerRef.current?.getBoundingClientRect();
  const viewBox = {
    x: pan.x,
    y: pan.y,
    width: (containerRect?.width || 800) / zoom,
    height: (containerRect?.height || 600) / zoom,
  };

  const getPos = (id: string) => mockPositions.find((p) => p.id === id)!;

  return (
    <div className="relative w-full h-[600px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Task filter dropdown - top left */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-card/90 backdrop-blur-sm">
              <Filter className="h-3.5 w-3.5" />
              Filter by Task
              {selectedTaskIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {selectedTaskIds.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[260px] bg-popover">
            {mockProjects.map((proj) => (
              <div key={proj.id}>
                <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
                  {proj.name}
                </p>
                {mockTasks
                  .filter((t) => t.projectId === proj.id)
                  .map((task) => (
                    <DropdownMenuCheckboxItem
                      key={task.id}
                      checked={selectedTaskIds.includes(task.id)}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                      className="text-xs"
                    >
                      {task.name}
                    </DropdownMenuCheckboxItem>
                  ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedTaskIds.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}

        {selectedNodeId && (
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            Focused: {mockMembers.find((m) => m.id === selectedNodeId)?.name}
          </Badge>
        )}
      </div>

      {/* Zoom controls - top right */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] text-muted-foreground w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full select-none"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          onClick={handleCanvasClick}
          style={{ overflow: "visible" }}
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width={40 * zoom} height={40 * zoom} patternUnits="userSpaceOnUse">
              <path
                d={`M ${40 * zoom} 0 L 0 0 0 ${40 * zoom}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeOpacity={0.3}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {visibleEdges.map((edge) => {
              const from = getPos(edge.fromId);
              const to = getPos(edge.toId);
              const cfg = EDGE_TYPE_CONFIG[edge.type];
              const isActive = selectedEdge?.edge.id === edge.id;
              const isDimmed =
                dimmedMemberIds.has(edge.fromId) || dimmedMemberIds.has(edge.toId);

              return (
                <g key={edge.id}>
                  {/* Hit area (wider invisible line for easier clicking) */}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="transparent"
                    strokeWidth={16}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdgeClick(edge);
                    }}
                  />
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={cfg.color}
                    strokeWidth={isActive ? 3 : Math.max(1, edge.strength / 3)}
                    strokeOpacity={isDimmed ? 0.1 : isActive ? 1 : 0.5}
                    strokeDasharray={cfg.dashArray || "none"}
                    style={{
                      transition: "stroke-opacity 0.4s ease, stroke-width 0.2s ease",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdgeClick(edge);
                    }}
                  />
                </g>
              );
            })}

            {/* Also draw dimmed edges that are NOT in visibleEdges (so they appear faintly) */}
            {mockEdges
              .filter((e) => !visibleEdges.includes(e))
              .map((edge) => {
                const from = getPos(edge.fromId);
                const to = getPos(edge.toId);
                const cfg = EDGE_TYPE_CONFIG[edge.type];
                return (
                  <line
                    key={`dim-${edge.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={cfg.color}
                    strokeWidth={1}
                    strokeOpacity={0.05}
                    strokeDasharray={cfg.dashArray || "none"}
                    style={{ transition: "stroke-opacity 0.4s ease" }}
                  />
                );
              })}

            {/* Nodes */}
            {mockMembers.map((member) => {
              const pos = getPos(member.id);
              return (
                <NetworkNode
                  key={member.id}
                  member={member}
                  x={pos.x}
                  y={pos.y}
                  isSelected={selectedNodeId === member.id}
                  isDimmed={dimmedMemberIds.has(member.id)}
                  isHighlighted={
                    !dimmedMemberIds.has(member.id) &&
                    (selectedNodeId !== null || selectedTaskIds.length > 0)
                  }
                  onClick={handleNodeClick}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Minimap */}
      <NetworkMinimap
        positions={mockPositions}
        viewBox={viewBox}
        canvasSize={{ width: CANVAS_W, height: CANVAS_H }}
      />

      {/* Legend */}
      <NetworkLegend />

      {/* Edge Drawer */}
      <EdgeDrawer interaction={selectedEdge} onClose={() => setSelectedEdge(null)} />
    </div>
  );
};

export default NetworkCanvas;
