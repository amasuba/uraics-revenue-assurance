import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { riskTypes, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export function TopRisksTable() {
  const topRisks = [...riskTypes].sort((a, b) => b.totalExposure - a.totalExposure).slice(0, 5);

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Top 5 Risks by Exposure</span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Cases</TableHead>
              <TableHead className="text-right">Exposure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topRisks.map((risk, index) => (
              <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm",
                    risk.severity === "High" ? "bg-destructive/10 text-destructive" :
                    risk.severity === "Medium" ? "bg-warning/10 text-warning" :
                    "bg-info/10 text-info"
                  )}>
                    {risk.id.toUpperCase()}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{risk.name}</p>
                    <p className="text-xs text-muted-foreground">{risk.category}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityVariant(risk.severity) as "destructive" | "secondary" | "outline"}>
                    {risk.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {risk.flaggedCount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(risk.totalExposure)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
