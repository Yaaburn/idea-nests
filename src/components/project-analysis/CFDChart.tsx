import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface CFDDataPoint {
  date: string;
  backlog: number;
  inProgress: number;
  review: number;
  done: number;
}

interface CFDChartProps {
  data: CFDDataPoint[];
  title?: string;
}

export const CFDChart = ({ data, title = "Cumulative Flow Diagram" }: CFDChartProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Shows work distribution across stages over time
        </p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="done"
              stackId="1"
              stroke="hsl(142, 76%, 36%)"
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.8}
              name="Done"
            />
            <Area
              type="monotone"
              dataKey="review"
              stackId="1"
              stroke="hsl(48, 96%, 53%)"
              fill="hsl(48, 96%, 53%)"
              fillOpacity={0.8}
              name="In Review"
            />
            <Area
              type="monotone"
              dataKey="inProgress"
              stackId="1"
              stroke="hsl(217, 91%, 60%)"
              fill="hsl(217, 91%, 60%)"
              fillOpacity={0.8}
              name="In Progress"
            />
            <Area
              type="monotone"
              dataKey="backlog"
              stackId="1"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.5}
              name="Backlog"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> A widening band indicates a bottleneck at that stage. 
          Ideally, the "Done" area should grow steadily while other bands remain thin.
        </p>
      </div>
    </div>
  );
};
