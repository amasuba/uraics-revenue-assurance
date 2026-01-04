import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { IncidentTrendChart } from "@/components/dashboard/IncidentTrendChart";
import { RegionalDistribution } from "@/components/dashboard/RegionalDistribution";
import { TopRisksTable } from "@/components/dashboard/TopRisksTable";
import { dashboardKPIs, formatCurrency, formatNumber } from "@/data/mockData";
import { Users, AlertTriangle, TrendingUp, DollarSign, ClipboardCheck, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <DashboardLayout title="Home Dashboard">
      <div className="space-y-6">
        {/* KPI Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <KPICard
            title="Total Taxpayers"
            value={formatNumber(dashboardKPIs.totalTaxpayers)}
            subtitle={`${formatNumber(dashboardKPIs.flaggedTaxpayers)} flagged`}
            icon={Users}
            variant="primary"
          />
          <KPICard
            title="Compliance Rate"
            value={`${dashboardKPIs.complianceRate}%`}
            subtitle="Target: 95%"
            icon={TrendingUp}
            trend={{ value: 2.3, isPositive: true }}
            variant="success"
          />
          <KPICard
            title="Total Exposure"
            value={formatCurrency(dashboardKPIs.totalExposure)}
            subtitle="Revenue at risk"
            icon={DollarSign}
            variant="destructive"
          />
          <KPICard
            title="Active Risks"
            value={dashboardKPIs.risksActive.toString()}
            subtitle="18 risk categories"
            icon={AlertTriangle}
            variant="warning"
          />
          <KPICard
            title="Pending Audits"
            value={formatNumber(dashboardKPIs.pendingAudits)}
            subtitle={`${formatNumber(dashboardKPIs.completedAudits)} completed`}
            icon={ClipboardCheck}
          />
          <KPICard
            title="Audit Recovery"
            value={formatCurrency(dashboardKPIs.auditRecovery)}
            subtitle="YTD collections"
            icon={ArrowUpRight}
            trend={{ value: 15.7, isPositive: true }}
            variant="success"
          />
        </div>

        {/* Risk Heatmap */}
        <RiskHeatmap />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <IncidentTrendChart />
          <RegionalDistribution />
        </div>

        {/* Top Risks Table */}
        <TopRisksTable />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <Link to="/audit-tasks">View Pending Audits</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/taxveritas">Investigate TIN</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/tatis360">Ask TATIS360</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin">Admin Insights</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
