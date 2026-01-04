/**
 * API Service for Frontend
 * Handles all API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface RiskData {
  riskId: string;
  summary: {
    totalTaxpayers: number;
    flaggedCount: number;
    totalExposure: number;
    avgExposure?: number;
    complianceRate?: number;
  };
  data: any[];
  relationships?: any[];
}

export interface DashboardKPIs {
  totalTaxpayers: number;
  flaggedTaxpayers: number;
  complianceRate: number;
  totalExposure: number;
  risksActive: number;
  pendingAudits: number;
  completedAudits: number;
  auditRecovery: number;
}

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get risk dashboard data
   */
  async getRiskData(
    riskId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      region?: string;
      limit?: number;
    }
  ): Promise<RiskData> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.region) params.append("region", filters.region);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    return this.fetch<RiskData>(`/risks/${riskId}?${params.toString()}`);
  }

  /**
   * Get risk summary
   */
  async getRiskSummary(
    riskId: string,
    startDate?: string,
    endDate?: string
  ): Promise<RiskData["summary"]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return this.fetch<RiskData["summary"]>(
      `/risks/${riskId}/summary?${params.toString()}`
    );
  }

  /**
   * Get flagged taxpayers for a risk
   */
  async getRiskTaxpayers(
    riskId: string,
    limit = 50,
    offset = 0
  ): Promise<{ riskId: string; taxpayers: any[]; total: number }> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    return this.fetch<{ riskId: string; taxpayers: any[]; total: number }>(
      `/risks/${riskId}/taxpayers?${params.toString()}`
    );
  }

  /**
   * Get dashboard KPIs
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    return this.fetch<DashboardKPIs>("/dashboard/kpis");
  }

  /**
   * Get regional distribution
   */
  async getRegionalDistribution(): Promise<any[]> {
    return this.fetch<any[]>("/dashboard/regional");
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    oracle: string;
    neo4j: string;
  }> {
    return this.fetch<{ status: string; oracle: string; neo4j: string }>(
      "/health"
    );
  }
}

export default new ApiService();

