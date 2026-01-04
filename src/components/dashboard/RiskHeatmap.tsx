import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { riskTypes, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function RiskHeatmap() {
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-destructive/80 hover:bg-destructive text-destructive-foreground";
      case "Medium":
        return "bg-warning/80 hover:bg-warning text-warning-foreground";
      case "Low":
        return "bg-info/80 hover:bg-info text-info-foreground";
      default:
        return "bg-muted";
    }
  };

  const sortedRisks = [...riskTypes].sort((a, b) => b.totalExposure - a.totalExposure);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          Risk Heatmap (18 Risk Types)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {sortedRisks.map((risk) => (
            <div
              key={risk.id}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105",
                getSeverityClass(risk.severity)
              )}
              title={`${risk.name}\nExposure: ${formatCurrency(risk.totalExposure)}\nCases: ${risk.flaggedCount}`}
            >
              <div className="text-center">
                <p className="text-lg font-bold uppercase">Risk {risk.id}</p>
                <p className="text-xs opacity-90 truncate">{risk.flaggedCount}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-destructive" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-warning" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-info" />
            <span className="text-muted-foreground">Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
