import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { riskTypes } from "@/data/mockData";
import { riskDetails } from "@/data/riskDetails";

const RiskDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const risk = riskTypes.find(r => r.id === id);
  const detail = riskDetails[id ?? ""];

  if (!risk || !detail) {
    return (
      <DashboardLayout title="Unknown Risk">
        <div className="p-8">
          <Card>
            <CardHeader><CardTitle>Risk Not Found</CardTitle></CardHeader>
            <CardContent>Sorry, the specified risk does not exist.</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Risk ${risk.id.toUpperCase()}: ${detail.title}`}>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {detail.title} <Badge>{risk.category}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-medium text-sm">
              {detail.description}
            </p>
            {/* TODO: Dynamic KPI, charts, tables based on API response for risk.id */}
            <div className="mt-8 text-xs text-muted-foreground">
              Multi-TIN Interactive Dashboard for Risk {risk.id.toUpperCase()} (Placeholder)
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RiskDashboard;
