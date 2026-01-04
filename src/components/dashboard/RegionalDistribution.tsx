import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { regionalData, formatCurrency } from "@/data/mockData";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";

export function RegionalDistribution() {
  const colors = [
    "hsl(122 68% 24%)",
    "hsl(122 45% 37%)",
    "hsl(45 100% 51%)",
    "hsl(28 100% 50%)",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${(val / 1000000000).toFixed(0)}B`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
                {regionalData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {regionalData.map((region, index) => (
            <div key={region.region} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{region.region}</span>
                <span className="text-muted-foreground">
                  {region.flaggedTaxpayers.toLocaleString()} / {region.totalTaxpayers.toLocaleString()} flagged
                </span>
              </div>
              <Progress
                value={100 - region.complianceRate}
                className="h-2"
                style={{ "--progress-background": colors[index] } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
