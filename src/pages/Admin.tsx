import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { dashboardKPIs, riskTypes, regionalData, formatCurrency, formatNumber, auditTasks } from "@/data/mockData";
import { 
  Users, TrendingUp, AlertTriangle, DollarSign, BarChart3, PieChart, 
  Activity, Shield, Target, UserCheck, Clock, CheckCircle2 
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Pie, PieChart as RechartsPie, Legend } from "recharts";

const Admin = () => {
  const auditorPerformance = [
    { name: "John Mukasa", tasksCompleted: 45, avgDays: 8.2, recovery: 1200000000 },
    { name: "Sarah Nakato", tasksCompleted: 38, avgDays: 7.5, recovery: 980000000 },
    { name: "Peter Ochieng", tasksCompleted: 42, avgDays: 9.1, recovery: 1450000000 },
    { name: "Mary Achieng", tasksCompleted: 35, avgDays: 6.8, recovery: 850000000 },
  ];

  const riskCategoryData = riskTypes.reduce((acc, risk) => {
    const existing = acc.find((item) => item.category === risk.category);
    if (existing) {
      existing.exposure += risk.totalExposure;
      existing.count += risk.flaggedCount;
    } else {
      acc.push({
        category: risk.category,
        exposure: risk.totalExposure,
        count: risk.flaggedCount,
      });
    }
    return acc;
  }, [] as { category: string; exposure: number; count: number }[]);

  const pieColors = [
    "hsl(122 68% 24%)",
    "hsl(45 100% 51%)",
    "hsl(0 72% 50%)",
    "hsl(28 100% 50%)",
    "hsl(210 79% 46%)",
    "hsl(280 65% 60%)",
    "hsl(160 60% 45%)",
    "hsl(340 75% 55%)",
  ];

  const systemHealth = [
    { metric: "Database Uptime", value: 99.9, status: "healthy" },
    { metric: "API Response Time", value: 98.5, status: "healthy" },
    { metric: "Data Sync Status", value: 100, status: "healthy" },
    { metric: "Neo4j Connection", value: 100, status: "healthy" },
  ];

  return (
    <DashboardLayout title="Admin Insights Dashboard">
      <div className="space-y-6">
        {/* Executive Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Exposure</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardKPIs.totalExposure)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">YTD Recovery</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardKPIs.auditRecovery)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Escalated Cases</p>
                  <p className="text-2xl font-bold">{dashboardKPIs.escalatedCases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-info/5 border-info/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-info flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-info-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold">{dashboardKPIs.complianceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <Tabs defaultValue="performance">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="performance">Team Performance</TabsTrigger>
                <TabsTrigger value="risks">Risk Analytics</TabsTrigger>
                <TabsTrigger value="regions">Regional Insights</TabsTrigger>
                <TabsTrigger value="system">System Health</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              {/* Team Performance Tab */}
              <TabsContent value="performance" className="mt-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Auditor Performance Metrics</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Auditor</TableHead>
                          <TableHead className="text-center">Tasks</TableHead>
                          <TableHead className="text-center">Avg Days</TableHead>
                          <TableHead className="text-right">Recovery</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditorPerformance.map((auditor) => (
                          <TableRow key={auditor.name}>
                            <TableCell className="font-medium">{auditor.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{auditor.tasksCompleted}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{auditor.avgDays} days</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(auditor.recovery)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recovery by Auditor</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={auditorPerformance} layout="vertical" margin={{ left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tickFormatter={(val) => `${(val / 1000000000).toFixed(1)}B`} />
                          <YAxis type="category" dataKey="name" />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="recovery" fill="hsl(122 68% 24%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Risk Analytics Tab */}
              <TabsContent value="risks" className="mt-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Exposure by Risk Category</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={riskCategoryData}
                            dataKey="exposure"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={({ category }) => category}
                          >
                            {riskCategoryData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Top Risk Categories</h3>
                    <div className="space-y-4">
                      {riskCategoryData
                        .sort((a, b) => b.exposure - a.exposure)
                        .slice(0, 5)
                        .map((cat, index) => (
                          <div key={cat.category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{cat.category}</span>
                              <span className="text-muted-foreground">{formatCurrency(cat.exposure)}</span>
                            </div>
                            <Progress
                              value={(cat.exposure / riskCategoryData[0].exposure) * 100}
                              className="h-2"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Regional Insights Tab */}
              <TabsContent value="regions" className="mt-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Regional Compliance Overview</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Region</TableHead>
                          <TableHead className="text-center">Taxpayers</TableHead>
                          <TableHead className="text-center">Flagged</TableHead>
                          <TableHead className="text-center">Rate</TableHead>
                          <TableHead className="text-right">Exposure</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regionalData.map((region) => (
                          <TableRow key={region.region}>
                            <TableCell className="font-medium">{region.region}</TableCell>
                            <TableCell className="text-center">{formatNumber(region.totalTaxpayers)}</TableCell>
                            <TableCell className="text-center">{formatNumber(region.flaggedTaxpayers)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={region.complianceRate >= 85 ? "default" : "destructive"}>
                                {region.complianceRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(region.exposure)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Regional Exposure Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regionalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="region" />
                          <YAxis tickFormatter={(val) => `${(val / 1000000000).toFixed(0)}B`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
                            {regionalData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* System Health Tab */}
              <TabsContent value="system" className="mt-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">System Health Metrics</h3>
                    <div className="space-y-4">
                      {systemHealth.map((item) => (
                        <div key={item.metric} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                            <span className="font-medium">{item.metric}</span>
                          </div>
                          <Badge variant="default" className="bg-success text-success-foreground">
                            {item.value}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                    <div className="grid gap-4 grid-cols-2">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">24/7</p>
                          <p className="text-sm text-muted-foreground">System Monitoring</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">AES-256</p>
                          <p className="text-sm text-muted-foreground">Data Encryption</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">&lt;200ms</p>
                          <p className="text-sm text-muted-foreground">Avg Response</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">99.99%</p>
                          <p className="text-sm text-muted-foreground">Uptime SLA</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
