import { isLeadStatus, LEAD_STATUS_LABELS } from '../types/api';

export function StatusBadge({ status }: { status: string }) {
  const known = isLeadStatus(status);
  return (
    <span className={`status-badge status-${known ? status : 'unknown'}`}>
      {known ? LEAD_STATUS_LABELS[status] : status || 'Без статуса'}
    </span>
  );
}
