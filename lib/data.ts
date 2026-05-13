import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'public', 'data');

async function readJson<T>(name: string): Promise<T> {
  const path = join(DATA_DIR, `${name}.json`);
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

export interface Overview {
  n_customers: number;
  n_orders: number;
  gmv: number;
  repeat_rate: number;
  period_start: string;
  period_end: string;
}

export interface CohortRow {
  cohort_month: string;
  retention: (number | null)[];
}

export interface CohortsData {
  max_period: number;
  cohorts: CohortRow[];
}

export interface SegmentRow {
  segment: string;
  n: number;
  share: number;
  avg_recency_days: number;
  avg_frequency: number;
  avg_monetary: number;
}

export interface ClvData {
  horizon_months: number;
  holdout_mape: number | null;
  bgnbd_params: Record<string, number>;
  percentiles: Record<string, number | null>;
  top_customers: Array<{
    customer_id: string;
    predicted_clv: number;
    frequency: number;
    monetary_value: number;
  }>;
}

export interface ChurnData {
  roc_auc: number;
  brier: number;
  calibration_curve: { mean_predicted: number[]; fraction_positives: number[] };
  at_risk: Array<{
    customer_id: string;
    churn_probability: number;
    n_orders: number;
    total_spend: number;
    days_since_last_order: number;
    customer_state: string;
  }>;
}

export interface CampaignData {
  naive_effect: number;
  did_effect: number;
  did_se: number;
  did_ci_low: number;
  did_ci_high: number;
  did_p_value: number;
  parallel_trends_p: number;
  n_treated: number;
  n_control: number;
  true_effect_oracle: number;
}

export const getOverview = () => readJson<Overview>('overview');
export const getCohorts = () => readJson<CohortsData>('cohorts');
export const getSegments = () => readJson<{ segments: SegmentRow[] }>('segments');
export const getClv = () => readJson<ClvData>('clv');
export const getChurn = () => readJson<ChurnData>('churn');
export const getCampaigns = () => readJson<CampaignData>('campaigns');
