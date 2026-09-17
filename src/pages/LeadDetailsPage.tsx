import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadAttachment, getLead, getLeadAttachments, updateLeadStatus } from '../api/leads';
import { EmptyState, ErrorState, LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { isLeadStatus, LEAD_STATUS_LABELS, LEAD_STATUSES, type Attachment, type Lead, type LeadStatus } from '../types/api';
import { getUserErrorMessage } from '../utils/errors';
import { formatDate, formatFileSize, formatFileType, formatFormType, isSafeHttpUrl } from '../utils/format';

function DetailField({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={`detail-field ${wide ? 'detail-field-wide' : ''}`}><dt>{label}</dt><dd>{children || <span className="muted-value">—</span>}</dd></div>;
}

function ContactLink({ kind, value }: { kind: 'phone' | 'email'; value: string | null }) {
  if (!value) return <span className="muted-value">—</span>;
  return <a href={kind === 'phone' ? `tel:${value}` : `mailto:${value}`}>{value}</a>;
}

export function LeadDetailsPage() {
  const { id = '' } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | ''>('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!/^\d+$/.test(id)) {
      setError('Некорректный идентификатор заявки.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loadedLead = await getLead(id);
      setLead(loadedLead);
      setSelectedStatus(isLeadStatus(loadedLead.status) ? loadedLead.status : '');
      setAttachments(await getLeadAttachments(id));
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, 'Не удалось загрузить заявку.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  const saveStatus = async () => {
    if (!lead || !selectedStatus || saving || selectedStatus === lead.status) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await updateLeadStatus(lead.id, selectedStatus);
      setLead(updated);
      setSelectedStatus(isLeadStatus(updated.status) ? updated.status : '');
      setSaveMessage('Статус заявки сохранён.');
    } catch (requestError) {
      setSaveMessage(getUserErrorMessage(requestError, 'Не удалось сохранить статус.'));
    } finally {
      setSaving(false);
    }
  };

  const startDownload = async (attachment: Attachment) => {
    if (downloadingId !== null) return;
    setDownloadingId(attachment.id);
    setDownloadError(null);
    try {
      await downloadAttachment(attachment);
    } catch (requestError) {
      setDownloadError(getUserErrorMessage(requestError, 'Не удалось скачать вложение.'));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <main className="page-content"><LoadingState label="Загружаем заявку…" /></main>;
  if (error) return <main className="page-content"><ErrorState message={error} onRetry={() => void loadDetails()} /></main>;
  if (!lead) return <main className="page-content"><EmptyState title="Заявка не найдена" description="Проверьте ссылку или вернитесь к списку заявок." /></main>;

  return (
    <main className="page-content">
      <Link className="back-link" to="/leads">← К списку заявок</Link>
      <div className="detail-header">
        <div><span className="eyebrow">LEAD / #{lead.id}</span><h1>{lead.name}</h1><p className="page-subtitle">Создана {formatDate(lead.created_at)}</p></div>
        <StatusBadge status={lead.status} />
      </div>
      <div className="details-layout">
        <section className="details-card" aria-labelledby="lead-data-title">
          <div className="card-heading"><div><span className="eyebrow">CLIENT DATA</span><h2 id="lead-data-title">Данные заявки</h2></div><span className="record-id">ID {lead.id}</span></div>
          <dl className="details-grid">
            <DetailField label="Имя">{lead.name}</DetailField>
            <DetailField label="Телефон"><ContactLink kind="phone" value={lead.phone} /></DetailField>
            <DetailField label="Email"><ContactLink kind="email" value={lead.email} /></DetailField>
            <DetailField label="Источник">{lead.source}</DetailField>
            <DetailField label="Тип формы">{formatFormType(lead.form_type)}</DetailField>
            <DetailField label="URL страницы">{lead.page_url && isSafeHttpUrl(lead.page_url) ? <a href={lead.page_url} target="_blank" rel="noreferrer">Открыть страницу ↗</a> : lead.page_url}</DetailField>
            <DetailField label="Сообщение" wide><span className="message-value">{lead.message}</span></DetailField>
          </dl>
          <div className="utm-block"><div className="section-label">UTM-ПАРАМЕТРЫ</div><dl className="details-grid details-grid-utm">
            <DetailField label="utm_source">{lead.utm_source}</DetailField><DetailField label="utm_medium">{lead.utm_medium}</DetailField><DetailField label="utm_campaign">{lead.utm_campaign}</DetailField><DetailField label="utm_term">{lead.utm_term}</DetailField><DetailField label="utm_content">{lead.utm_content}</DetailField>
          </dl></div>
        </section>
        <aside className="side-stack">
          <section className="status-card" aria-labelledby="status-title">
            <div className="card-heading"><div><span className="eyebrow">WORKFLOW</span><h2 id="status-title">Статус</h2></div><StatusBadge status={lead.status} /></div>
            <label className="select-label" htmlFor="lead-status">Текущий этап заявки</label>
            <select id="lead-status" value={selectedStatus} onChange={(event) => { setSelectedStatus(event.target.value as LeadStatus | ''); setSaveMessage(null); }} disabled={saving}>
              {!selectedStatus && <option value="">Выберите статус</option>}
              {LEAD_STATUSES.map((status) => <option value={status} key={status}>{LEAD_STATUS_LABELS[status]}</option>)}
            </select>
            <button className="button button-primary button-wide" onClick={() => void saveStatus()} disabled={saving || !selectedStatus || selectedStatus === lead.status}>
              {saving ? <><span className="spinner spinner-small" aria-hidden="true" /> Сохраняем…</> : 'Сохранить статус'}
            </button>
            {saveMessage && <p className={`inline-message ${saveMessage.includes('не удалось') ? 'inline-error' : 'inline-success'}`} role={saveMessage.includes('не удалось') ? 'alert' : 'status'}>{saveMessage}</p>}
          </section>
          <section className="attachments-card" aria-labelledby="attachments-title">
            <div className="card-heading"><div><span className="eyebrow">FILES / {attachments?.length ?? 0}</span><h2 id="attachments-title">Вложения</h2></div></div>
            {downloadError && <div className="notice notice-error" role="alert">{downloadError}</div>}
            {attachments?.length === 0 && <p className="muted empty-attachments">В этой заявке нет вложений.</p>}
            {attachments && attachments.length > 0 && <ul className="attachment-list">{attachments.map((attachment) => <li key={attachment.id} className="attachment-item"><span className="file-icon" aria-hidden="true">□</span><span className="attachment-info"><strong title={attachment.original_filename}>{attachment.original_filename}</strong><small>{[formatFileType(attachment.content_type), formatFileSize(attachment.size), formatDate(attachment.created_at)].filter(Boolean).join(' · ')}</small></span><button className="download-button" onClick={() => void startDownload(attachment)} disabled={downloadingId !== null} aria-label={`Скачать ${attachment.original_filename}`}>{downloadingId === attachment.id ? 'Скачиваем…' : <><span aria-hidden="true">↓</span><span>Скачать</span></>}</button></li>)}</ul>}
          </section>
        </aside>
      </div>
    </main>
  );
}
