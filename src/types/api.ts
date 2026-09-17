export const LEAD_STATUSES = [
  'new',
  'contacted',
  'calculation',
  'proposal',
  'contract',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новая',
  contacted: 'Связались',
  calculation: 'Расчёт',
  proposal: 'Предложение',
  contract: 'Договор',
  lost: 'Потеряна',
};

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Lead {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  page_url: string | null;
  form_type: string | null;
  message: string | null;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
}

export interface Attachment {
  id: number;
  lead_id: number;
  original_filename: string;
  stored_filename: string;
  content_type: string | null;
  size: number;
  storage_path: string;
  created_at: string;
}

export interface ApiValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface ApiErrorBody {
  detail?: string | ApiValidationError[];
}

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
