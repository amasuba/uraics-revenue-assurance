import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Building, AlertTriangle, FileText, Clock, DollarSign, MapPin } from "lucide-react";
import { sampleTaxpayers, riskTypes, formatCurrency, getSeverityColor } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface TaxpayerDetail {
  tin: string;
  name: string;
  sector: string;
  region: string;
  status: string;
  registrationDate: string;
  lastFilingDate: string;
  totalTurnover: number;
  taxesDue: number;
  riskFlags: { id: string; name: string; severity: string; exposure: number }[];
  filingHistory: { period: string; type: string; status: string; amount: number }[];
}

const mockTaxpayerDetail: TaxpayerDetail = {
  tin: "TIN001234567",
  name: "Kampala Trading Ltd",
  sector: "Retail",
  region: "Kampala",
  status: "Active",
  registrationDate: "2015-03-15",
  lastFilingDate: "2024-06-30",
  totalTurnover: 2500000000,
  taxesDue: 450000000,
  riskFlags: [
    { id: "a", name: "Presumptive Tax Underpayment", severity: "High", exposure: 180000000 },
    { id: "b", name: "EFRIS Sales Variance", severity: "High", exposure: 150000000 },
    { id: "g", name: "VAT Input Irregular", severity: "Medium", exposure: 120000000 },
  ],
  filingHistory: [
    { period: "2024 Q2", type: "VAT Return", status: "Filed", amount: 45000000 },
    { period: "2024 Q1", type: "VAT Return", status: "Filed", amount: 52000000 },
    { period: "2023", type: "Income Tax", status: "Filed", amount: 180000000 },
    { period: "2023 Q4", type: "VAT Return", status: "Filed", amount: 38000000 },
    { period: "2023 Q3", type: "VAT Return", status: "Late", amount: 41000000 },
  ],
};

const TaxVeritas = () => {
  const [searchTin, setSearchTin] = useState("");
  const [searchResult, setSearchResult] = useState<TaxpayerDetail | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchTin.trim()) return;
    
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setSearchResult(mockTaxpayerDetail);
      setIsSearching(false);
    }, 800);
  };

  return (
    <DashboardLayout title="TaxVeritas - TIN Investigation">
      <div className="space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              TIN Investigation Portal
            </CardTitle>
            <CardDescription>
              Enter a Tax Identification Number to view detailed taxpayer profile, risks, and filing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-3"
            >
              <Input
                value={searchTin}
                onChange={(e) => setSearchTin(e.target.value)}
                placeholder="Enter TIN (e.g., TIN001234567)"
                className="max-w-md"
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? "Searching..." : "Search TIN"}
              </Button>
            </form>

            {/* Recent Searches */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Quick access:</p>
              <div className="flex flex-wrap gap-2">
                {sampleTaxpayers.slice(0, 4).map((tp) => (
                  <Badge
                    key={tp.tin}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSearchTin(tp.tin);
                      setSearchResult(mockTaxpayerDetail);
                    }}
                  >
                    {tp.tin}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Result */}
        {searchResult && (
          <div className="space-y-6">
            {/* Taxpayer Overview */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {searchResult.name}
                      </CardTitle>
                      <CardDescription>{searchResult.tin}</CardDescription>
                    </div>
                    <Badge
                      variant={searchResult.status === "Active" ? "default" : "secondary"}
                      className="bg-success text-success-foreground"
                    >
                      {searchResult.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sector</p>
                        <p className="font-medium">{searchResult.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Region</p>
                        <p className="font-medium">{searchResult.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Registered</p>
                        <p className="font-medium">{searchResult.registrationDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Filing</p>
                        <p className="font-medium">{searchResult.lastFilingDate}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-destructive/10 rounded-lg">
                      <p className="text-3xl font-bold text-destructive">
                        {searchResult.riskFlags.length}
                      </p>
                      <p className="text-sm text-destructive">Active Risk Flags</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Exposure</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(searchResult.riskFlags.reduce((sum, r) => sum + r.exposure, 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Tabs */}
            <Card>
              <Tabs defaultValue="risks">
                <CardHeader>
                  <TabsList>
                    <TabsTrigger value="risks">Risk Flags</TabsTrigger>
                    <TabsTrigger value="filings">Filing History</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="risks" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Risk ID</TableHead>
                          <TableHead>Risk Name</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead className="text-right">Exposure</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResult.riskFlags.map((risk) => (
                          <TableRow key={risk.id}>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                risk.severity === "High" ? "border-destructive text-destructive" :
                                risk.severity === "Medium" ? "border-warning text-warning" :
                                "border-info text-info"
                              )}>
                                Risk {risk.id.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{risk.name}</TableCell>
                            <TableCell>
                              <Badge variant={risk.severity === "High" ? "destructive" : "secondary"}>
                                {risk.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(risk.exposure)}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                Investigate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="filings" className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResult.filingHistory.map((filing, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{filing.period}</TableCell>
                            <TableCell>{filing.type}</TableCell>
                            <TableCell>
                              <Badge variant={filing.status === "Filed" ? "default" : "destructive"}>
                                {filing.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(filing.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="financials" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Turnover (2023)</p>
                          <p className="text-2xl font-bold">{formatCurrency(searchResult.totalTurnover)}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Taxes Due</p>
                          <p className="text-2xl font-bold text-destructive">{formatCurrency(searchResult.taxesDue)}</p>
                        </div>
                      </div>
                      <div className="p-6 bg-primary/5 rounded-lg">
                        <h4 className="font-semibold mb-4">Compliance Score</h4>
                        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-warning rounded-full"
                            style={{ width: "65%" }}
                          />
                        </div>
                        <p className="mt-2 text-2xl font-bold">65%</p>
                        <p className="text-sm text-muted-foreground">Needs improvement</p>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaxVeritas;
