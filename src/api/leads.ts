import { apiClient } from './client';
import { DEMO_DOWNLOAD_MESSAGE, getDemoLead, getDemoLeadAttachments, getDemoLeads, updateDemoLeadStatus } from './demo';
import { isDemoMode } from '../config/runtime';
import type { Attachment, Lead, LeadStatus } from '../types/api';

export function getLeads(): Promise<Lead[]> {
  if (isDemoMode()) return getDemoLeads();
  return apiClient.request<Lead[]>('/api/admin/leads');
}

export function getLead(id: string): Promise<Lead> {
  if (isDemoMode()) return getDemoLead(id);
  return apiClient.request<Lead>(`/api/admin/leads/${encodeURIComponent(id)}`);
}

export function updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  if (isDemoMode()) return updateDemoLeadStatus(id, status);
  return apiClient.request<Lead>(`/api/admin/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getLeadAttachments(id: string): Promise<Attachment[]> {
  if (isDemoMode()) return getDemoLeadAttachments(id);
  return apiClient.request<Attachment[]>(`/api/admin/leads/${encodeURIComponent(id)}/attachments`);
}

function decodeFilename(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getDownloadFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('content-disposition') ?? '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeFilename(encoded.replace(/^"|"$/g, ''));
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plain ? plain : fallback;
}

export async function downloadAttachment(attachment: Attachment): Promise<void> {
  if (isDemoMode()) throw new Error(DEMO_DOWNLOAD_MESSAGE);
  const response = await apiClient.requestBlob(
    `/api/admin/attachments/${attachment.id}/download`,
  );
  const blob = await response.blob();
  const filename = getDownloadFilename(response, attachment.original_filename);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.setAttribute('aria-hidden', 'true');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
