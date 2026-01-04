import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { incidentTrends } from "@/data/mockData";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function IncidentTrendChart() {
  const chartData = incidentTrends.slice(-14).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    High: item.high,
    Medium: item.medium,
    Low: item.low,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Trends (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 72% 50%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(0 72% 50%)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(28 100% 50%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(28 100% 50%)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210 79% 46%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(210 79% 46%)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="High"
                stroke="hsl(0 72% 50%)"
                fillOpacity={1}
                fill="url(#colorHigh)"
              />
              <Area
                type="monotone"
                dataKey="Medium"
                stroke="hsl(28 100% 50%)"
                fillOpacity={1}
                fill="url(#colorMedium)"
              />
              <Area
                type="monotone"
                dataKey="Low"
                stroke="hsl(210 79% 46%)"
                fillOpacity={1}
                fill="url(#colorLow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
