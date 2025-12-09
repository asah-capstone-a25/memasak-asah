/**
 * Reason code from SHAP explanation
 */
export interface ReasonCode {
  feature: string;
  direction: "positive" | "negative";
  shap_value: number;
}

/**
 * Risk level categories
 */
export type RiskLevel = "Low" | "Medium" | "High";

/**
 * Lead - individual customer record with model scores
 */
export interface Lead {
  id: string;
  campaign_run_id: string;
  row_index: number;

  // Customer demographic features
  age: number;
  job: string;
  marital: string;
  education: string;

  // Customer financial features
  default_credit: string; // 'yes' | 'no'
  balance: number;
  housing: string; // 'yes' | 'no'
  loan: string; // 'yes' | 'no'

  // Campaign contact features
  contact: string;
  day: number;
  month: string;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;

  // Model prediction results
  probability: number;
  prediction: 0 | 1;
  prediction_label: "yes" | "no";
  risk_level: RiskLevel;
  reason_codes: ReasonCode[];

  // Timestamps
  created_at: string;
}

/**
 * Lead with campaign info (for joined queries)
 */
export interface LeadWithCampaign extends Lead {
  campaign_info: {
    id: string;
    name: string;
    source_filename: string;
  };
}

/**
 * Lead for list view (subset of fields for performance)
 */
export interface LeadListItem {
  id: string;
  row_index: number;
  age: number;
  job: string;
  marital: string;
  education: string;
  balance: number;
  probability: number;
  risk_level: RiskLevel;
}

/**
 * Payload for inserting leads (matches bulk-score response)
 */
export interface CreateLeadPayload {
  campaign_run_id: string;
  row_index: number;

  // Customer features
  age: number;
  job: string;
  marital: string;
  education: string;
  default_credit: string;
  balance: number;
  housing: string;
  loan: string;
  contact: string;
  day: number;
  month: string;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;

  // Model scores
  probability: number;
  prediction: 0 | 1;
  prediction_label: "yes" | "no";
  risk_level: RiskLevel;
  reason_codes: ReasonCode[];
}
