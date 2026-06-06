import api from '@/services/api';
import type { ApiResponse } from '@/features/auth/types/auth';

export interface ReportPoint {
  date: string;
  value: number;
}

export interface ReportSummary {
  purchasedCount: number;
  changePercent: number;
  series: ReportPoint[];
}

export interface TrendItem {
  categoryId: number | null;
  label: string;
  count: number;
  percent: number;
  color?: string;
}

export interface ReportTrend {
  totalCount: number;
  items: TrendItem[];
}

export interface WasteSummary {
  expiredCount: number;
  changePercent: number;
  note: string;
}

export interface ReportDetail {
  purchaseSeries: ReportPoint[];
  usedSeries: ReportPoint[];
  expiredSeries: ReportPoint[];
}

export interface ReportOverview {
  from: string;
  to: string;
  summary: ReportSummary;
  trend: ReportTrend;
  waste: WasteSummary;
  detail: ReportDetail;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface ReportQueryParams {
  from: string;
  to: string;
  userId?: number;
  familyId?: number;
  categoryId?: number | null;
}

let categoriesCache: CategoryOption[] | null = null;
let categoriesRequest: Promise<CategoryOption[]> | null = null;

export const fetchReportOverview = async (params: ReportQueryParams): Promise<ReportOverview> => {
  const response = await api.get<ApiResponse<ReportOverview>>('/api/v1/reports/overview', { params });
  return response.data.data;
};

export const fetchCategories = async (): Promise<CategoryOption[]> => {
  if (categoriesCache) {
    return categoriesCache;
  }

  if (categoriesRequest) {
    return categoriesRequest;
  }

  categoriesRequest = api
    .get<CategoryOption[]>('/api/categories')
    .then((response) => {
      categoriesCache = response.data;
      return categoriesCache;
    })
    .finally(() => {
      categoriesRequest = null;
    });

  return categoriesRequest;
};
