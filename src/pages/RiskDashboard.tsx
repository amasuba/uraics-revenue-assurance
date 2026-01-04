import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { riskTypes } from "@/data/mockData";
import { riskDetails } from "@/data/riskDetails";
import apiService from "@/services/api.service";
import { Users, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency, formatNumber } from "@/data/mockData";

const RiskDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const risk = riskTypes.find(r => r.id === id);
  const detail = riskDetails[id ?? ""];
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        // Try to fetch from API, fallback to mock data if API unavailable
        try {
          const data = await apiService.getRiskData(id, {
            startDate: "01/07/2023",
            endDate: "31/01/2024",
          });
          setRiskData(data);
        } catch (apiError) {
          console.warn("API not available, using mock data:", apiError);
          // Fallback to mock data structure
          setRiskData({
            riskId: id,
            summary: {
              totalTaxpayers: risk?.flaggedCount || 0,
              flaggedCount: risk?.flaggedCount || 0,
              totalExposure: risk?.totalExposure || 0,
            },
            data: [],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load risk data");
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [id, risk]);

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

  if (loading) {
    return (
      <DashboardLayout title={`Risk ${risk.id.toUpperCase()}: ${detail.title}`}>
        <div className="p-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">Loading risk data...</div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title={`Risk ${risk.id.toUpperCase()}: ${detail.title}`}>
        <div className="p-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-destructive">Error: {error}</div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const summary = riskData?.summary || {
    totalTaxpayers: 0,
    flaggedCount: 0,
    totalExposure: 0,
  };

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
            <p className="mb-4 font-medium text-sm">
              {detail.description}
            </p>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Taxpayers"
            value={formatNumber(summary.totalTaxpayers)}
            subtitle={`${formatNumber(summary.flaggedCount)} flagged`}
            icon={Users}
            variant="primary"
          />
          <KPICard
            title="Flagged Cases"
            value={formatNumber(summary.flaggedCount)}
            subtitle={`${summary.totalTaxpayers > 0 ? ((summary.flaggedCount / summary.totalTaxpayers) * 100).toFixed(1) : 0}% of total`}
            icon={AlertTriangle}
            variant="destructive"
          />
          <KPICard
            title="Total Exposure"
            value={formatCurrency(summary.totalExposure)}
            subtitle="Revenue at risk"
            icon={DollarSign}
            variant="destructive"
          />
          <KPICard
            title="Compliance Rate"
            value={`${summary.totalTaxpayers > 0 ? (((summary.totalTaxpayers - summary.flaggedCount) / summary.totalTaxpayers) * 100).toFixed(1) : 0}%`}
            subtitle="Target: 95%"
            icon={TrendingUp}
            variant="success"
          />
        </div>

        {/* Data Table Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Data</CardTitle>
          </CardHeader>
          <CardContent>
            {riskData?.data && riskData.data.length > 0 ? (
              <div className="text-sm">
                Data loaded: {riskData.data.length} records
                {/* Table will be implemented here */}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Multi-TIN Interactive Dashboard for Risk {risk.id.toUpperCase()}
                <br />
                Connect to backend API to view real data from ETAXDB
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RiskDashboard;
