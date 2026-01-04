// URAICS Mock Data - Comprehensive test data for the dashboard

export interface Taxpayer {
  tin: string;
  name: string;
  region: string;
  sector: string;
  complianceStatus: 'Compliant' | 'Partially Compliant' | 'Non-Compliant';
  riskFlags: string[];
  totalExposure: number;
  lastFilingDate: string;
}

export interface RiskFlag {
  id: string;
  name: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  flaggedCount: number;
  totalExposure: number;
  category: string;
}

export interface AuditTask {
  id: string;
  tin: string;
  taxpayerName: string;
  riskId: string;
  riskName: string;
  assignedTo: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Assigned' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
  dueDate: string;
  exposureAmount: number;
  notes: string;
}

export interface IncidentTrend {
  date: string;
  high: number;
  medium: number;
  low: number;
}

export interface RegionalData {
  region: string;
  totalTaxpayers: number;
  flaggedTaxpayers: number;
  exposure: number;
  complianceRate: number;
}

// Risk types with descriptions
export const riskTypes: RiskFlag[] = [
  { id: 'a', name: 'Presumptive Tax Underpayment', description: 'Turnover exceeds presumptive threshold', severity: 'High', flaggedCount: 2340, totalExposure: 8500000000, category: 'Income Tax' },
  { id: 'b', name: 'EFRIS Sales Variance', description: 'IT declarations vs EFRIS mismatch', severity: 'High', flaggedCount: 1890, totalExposure: 6200000000, category: 'VAT' },
  { id: 'c', name: 'WHT Non-Remittance', description: 'WHT deducted but not remitted', severity: 'High', flaggedCount: 1560, totalExposure: 4800000000, category: 'WHT' },
  { id: 'd', name: 'VAT Misclassification', description: 'Incorrect VAT categorization', severity: 'Medium', flaggedCount: 1230, totalExposure: 3200000000, category: 'VAT' },
  { id: 'e', name: 'Impairment Understatement', description: 'Asset impairment understated', severity: 'Medium', flaggedCount: 890, totalExposure: 2100000000, category: 'Corporate Tax' },
  { id: 'f', name: 'Bad Debt Irregular Write-off', description: 'Irregular bad debt claims', severity: 'Medium', flaggedCount: 670, totalExposure: 1800000000, category: 'Corporate Tax' },
  { id: 'g', name: 'VAT Input Irregular', description: 'Irregular VAT input claims', severity: 'High', flaggedCount: 1120, totalExposure: 4100000000, category: 'VAT' },
  { id: 'h', name: 'IR/EFRIS Reconciliation', description: 'Income register vs EFRIS gap', severity: 'Medium', flaggedCount: 980, totalExposure: 2800000000, category: 'Compliance' },
  { id: 'i', name: 'Multiple TIN Accounts', description: 'Taxpayer with multiple TINs', severity: 'High', flaggedCount: 340, totalExposure: 5600000000, category: 'Registration' },
  { id: 'j', name: 'Industry Benchmark Variance', description: 'Performance below industry norm', severity: 'Low', flaggedCount: 2100, totalExposure: 1500000000, category: 'Analytics' },
  { id: 'k', name: 'Transfer Pricing Anomaly', description: 'Related party pricing issues', severity: 'High', flaggedCount: 180, totalExposure: 12000000000, category: 'International Tax' },
  { id: 'l', name: 'Related Party Underpricing', description: 'Below market value transactions', severity: 'High', flaggedCount: 220, totalExposure: 8900000000, category: 'International Tax' },
  { id: 'm', name: 'Expense Timing Variance', description: 'Expense recognition timing issues', severity: 'Low', flaggedCount: 1450, totalExposure: 980000000, category: 'Corporate Tax' },
  { id: 'n', name: 'Inventory Valuation Variance', description: 'Inventory valuation discrepancies', severity: 'Medium', flaggedCount: 780, totalExposure: 2400000000, category: 'Corporate Tax' },
  { id: 'o', name: 'Depreciation Variance', description: 'Accelerated depreciation claims', severity: 'Low', flaggedCount: 890, totalExposure: 1200000000, category: 'Corporate Tax' },
  { id: 'p', name: 'Inter-year Consistency Variance', description: 'Year-over-year inconsistencies', severity: 'Medium', flaggedCount: 560, totalExposure: 1600000000, category: 'Analytics' },
  { id: 'q', name: 'Cryptocurrency Transaction', description: 'Unreported crypto transactions', severity: 'High', flaggedCount: 120, totalExposure: 3400000000, category: 'Emerging Risks' },
  { id: 'r', name: 'Cross-border Transaction Variance', description: 'International payment anomalies', severity: 'High', flaggedCount: 290, totalExposure: 7200000000, category: 'International Tax' },
  { id: 's', name: 'Round-dollar Threshold Pattern', description: 'Suspicious round number patterns', severity: 'Low', flaggedCount: 1890, totalExposure: 890000000, category: 'Fraud Detection' },
];

// Regional distribution data
export const regionalData: RegionalData[] = [
  { region: 'Kampala', totalTaxpayers: 45000, flaggedTaxpayers: 8900, exposure: 32000000000, complianceRate: 80.2 },
  { region: 'Central', totalTaxpayers: 28000, flaggedTaxpayers: 4200, exposure: 18000000000, complianceRate: 85.0 },
  { region: 'Western', totalTaxpayers: 18000, flaggedTaxpayers: 2700, exposure: 9500000000, complianceRate: 85.0 },
  { region: 'Eastern', totalTaxpayers: 15000, flaggedTaxpayers: 2100, exposure: 7800000000, complianceRate: 86.0 },
];

// Incident trends (last 30 days)
export const incidentTrends: IncidentTrend[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    high: Math.floor(Math.random() * 50) + 30,
    medium: Math.floor(Math.random() * 80) + 50,
    low: Math.floor(Math.random() * 100) + 80,
  };
});

// Sample taxpayers
export const sampleTaxpayers: Taxpayer[] = [
  { tin: 'TIN001234567', name: 'Kampala Trading Ltd', region: 'Kampala', sector: 'Retail', complianceStatus: 'Non-Compliant', riskFlags: ['a', 'b', 'g'], totalExposure: 450000000, lastFilingDate: '2024-06-30' },
  { tin: 'TIN002345678', name: 'Uganda Exports Co', region: 'Central', sector: 'Manufacturing', complianceStatus: 'Partially Compliant', riskFlags: ['k', 'l'], totalExposure: 890000000, lastFilingDate: '2024-09-15' },
  { tin: 'TIN003456789', name: 'Eastern Agriculture', region: 'Eastern', sector: 'Agriculture', complianceStatus: 'Compliant', riskFlags: [], totalExposure: 0, lastFilingDate: '2024-12-01' },
  { tin: 'TIN004567890', name: 'Western Mining Corp', region: 'Western', sector: 'Mining', complianceStatus: 'Non-Compliant', riskFlags: ['c', 'h', 'r'], totalExposure: 1200000000, lastFilingDate: '2024-03-20' },
  { tin: 'TIN005678901', name: 'Tech Solutions Uganda', region: 'Kampala', sector: 'Technology', complianceStatus: 'Partially Compliant', riskFlags: ['q'], totalExposure: 340000000, lastFilingDate: '2024-11-30' },
];

// Sample audit tasks
export const auditTasks: AuditTask[] = [
  { id: 'AT001', tin: 'TIN001234567', taxpayerName: 'Kampala Trading Ltd', riskId: 'a', riskName: 'Presumptive Tax', assignedTo: 'John Mukasa', priority: 'Critical', status: 'In Progress', dueDate: '2025-01-15', exposureAmount: 450000000, notes: 'Urgent review required' },
  { id: 'AT002', tin: 'TIN002345678', taxpayerName: 'Uganda Exports Co', riskId: 'k', riskName: 'Transfer Pricing', assignedTo: 'Sarah Nakato', priority: 'High', status: 'Assigned', dueDate: '2025-01-20', exposureAmount: 890000000, notes: 'International transactions review' },
  { id: 'AT003', tin: 'TIN004567890', taxpayerName: 'Western Mining Corp', riskId: 'c', riskName: 'WHT Non-Remittance', assignedTo: 'Peter Ochieng', priority: 'High', status: 'Under Review', dueDate: '2025-01-10', exposureAmount: 560000000, notes: 'Pending documentation' },
  { id: 'AT004', tin: 'TIN005678901', taxpayerName: 'Tech Solutions Uganda', riskId: 'q', riskName: 'Cryptocurrency', assignedTo: 'Mary Achieng', priority: 'Medium', status: 'Assigned', dueDate: '2025-02-01', exposureAmount: 340000000, notes: 'New risk category' },
  { id: 'AT005', tin: 'TIN006789012', taxpayerName: 'Central Imports Ltd', riskId: 'b', riskName: 'EFRIS Variance', assignedTo: 'John Mukasa', priority: 'Critical', status: 'In Progress', dueDate: '2025-01-08', exposureAmount: 720000000, notes: 'Large variance detected' },
  { id: 'AT006', tin: 'TIN007890123', taxpayerName: 'Northern Logistics', riskId: 'g', riskName: 'VAT Input Irregular', assignedTo: 'Sarah Nakato', priority: 'High', status: 'Completed', dueDate: '2024-12-20', exposureAmount: 280000000, notes: 'Assessment issued' },
  { id: 'AT007', tin: 'TIN008901234', taxpayerName: 'Lake Region Hotels', riskId: 'l', riskName: 'Related Party', assignedTo: 'Peter Ochieng', priority: 'Medium', status: 'On Hold', dueDate: '2025-02-15', exposureAmount: 450000000, notes: 'Awaiting TP documentation' },
];

// Dashboard KPIs
export const dashboardKPIs = {
  totalTaxpayers: 106000,
  flaggedTaxpayers: 17900,
  compliantTaxpayers: 88100,
  complianceRate: 83.1,
  totalExposure: 67300000000,
  averageExposure: 3760000,
  risksActive: 19,
  totalRiskTypes: 19,
  pendingAudits: 234,
  completedAudits: 1456,
  auditRecovery: 24500000000,
  escalatedCases: 45,
};

// Format currency in UGX
export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `UGX ${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `UGX ${(amount / 1000).toFixed(1)}K`;
  }
  return `UGX ${amount.toLocaleString()}`;
};

// Format large numbers
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Get severity color class
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'High':
    case 'Critical':
      return 'text-destructive';
    case 'Medium':
      return 'text-warning';
    case 'Low':
      return 'text-info';
    default:
      return 'text-muted-foreground';
  }
};

// Get status color class
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed':
      return 'bg-success/10 text-success border-success/20';
    case 'In Progress':
      return 'bg-accent/10 text-accent-foreground border-accent/20';
    case 'Under Review':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'Assigned':
      return 'bg-info/10 text-info border-info/20';
    case 'On Hold':
      return 'bg-muted text-muted-foreground border-muted';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
