import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteAttachment, deleteLead, downloadAttachment, getLead, getLeadAttachments, updateLeadStatus } from '../api/leads';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | ''>('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const [attachmentMessage, setAttachmentMessage] = useState<string | null>(null);
  const [attachmentDeleteError, setAttachmentDeleteError] = useState<string | null>(null);
  const [leadDeleteDialogOpen, setLeadDeleteDialogOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);
  const [leadDeleteError, setLeadDeleteError] = useState<string | null>(null);

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

  const confirmAttachmentDelete = async () => {
    if (!selectedAttachment || deletingAttachmentId !== null) return;
    const attachment = selectedAttachment;
    setDeletingAttachmentId(attachment.id);
    setAttachmentMessage(null);
    setAttachmentDeleteError(null);
    try {
      await deleteAttachment(attachment.id);
      setAttachments((current) => current?.filter((item) => item.id !== attachment.id) ?? current);
      setSelectedAttachment(null);
      setAttachmentMessage('Вложение удалено');
    } catch (requestError) {
      setSelectedAttachment(null);
      setAttachmentDeleteError(getUserErrorMessage(requestError, 'Не удалось удалить вложение.'));
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const confirmLeadDelete = async () => {
    if (!lead || deletingLead) return;
    setDeletingLead(true);
    setLeadDeleteError(null);
    try {
      await deleteLead(lead.id);
      navigate('/leads', { replace: true });
    } catch (requestError) {
      setLeadDeleteError(getUserErrorMessage(requestError, 'Не удалось удалить заявку.'));
      setLeadDeleteDialogOpen(false);
    } finally {
      setDeletingLead(false);
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
            <select id="lead-status" value={selectedStatus} onChange={(event) => { setSelectedStatus(event.target.value as LeadStatus | ''); setSaveMessage(null); }} disabled={saving || deletingLead}>
              {!selectedStatus && <option value="">Выберите статус</option>}
              {LEAD_STATUSES.map((status) => <option value={status} key={status}>{LEAD_STATUS_LABELS[status]}</option>)}
            </select>
            <button className="button button-primary button-wide" onClick={() => void saveStatus()} disabled={saving || deletingLead || !selectedStatus || selectedStatus === lead.status}>
              {saving ? <><span className="spinner spinner-small" aria-hidden="true" /> Сохраняем…</> : 'Сохранить статус'}
            </button>
            {saveMessage && <p className={`inline-message ${saveMessage.includes('не удалось') ? 'inline-error' : 'inline-success'}`} role={saveMessage.includes('не удалось') ? 'alert' : 'status'}>{saveMessage}</p>}
          </section>
          <section className='danger-card' aria-labelledby='delete-lead-title'>
            <div className='card-heading'>
              <div>
                <span className='eyebrow'>DANGER ZONE</span>
                <h2 id='delete-lead-title'>Удаление заявки</h2>
              </div>
            </div>
            <p className='danger-warning'>Удаление необратимо и также удалит все вложения этой заявки.</p>
            <button className='button button-danger button-wide' type='button' onClick={() => { setLeadDeleteError(null); setLeadDeleteDialogOpen(true); }} disabled={deletingLead || deletingAttachmentId !== null}>
              Удалить заявку
            </button>
            {leadDeleteError && <div className='notice notice-error' role='alert'>{leadDeleteError}</div>}
          </section>
          <section className="attachments-card" aria-labelledby="attachments-title">
            <div className="card-heading"><div><span className="eyebrow">FILES / {attachments?.length ?? 0}</span><h2 id="attachments-title">Вложения</h2></div></div>
            {downloadError && <div className="notice notice-error" role="alert">{downloadError}</div>}
            {attachmentMessage && <div className='notice notice-success' role='status'>{attachmentMessage}</div>}
            {attachmentDeleteError && <div className='notice notice-error' role='alert'>{attachmentDeleteError}</div>}
            {attachments?.length === 0 && <p className="muted empty-attachments">В этой заявке нет вложений.</p>}
            {attachments && attachments.length > 0 && <ul className="attachment-list">{attachments.map((attachment) => <li key={attachment.id} className="attachment-item"><span className="file-icon" aria-hidden="true">□</span><span className="attachment-info"><strong title={attachment.original_filename}>{attachment.original_filename}</strong><small>{[formatFileType(attachment.content_type), formatFileSize(attachment.size), formatDate(attachment.created_at)].filter(Boolean).join(' · ')}</small></span><span className='attachment-actions'><button className="download-button" onClick={() => void startDownload(attachment)} disabled={downloadingId !== null || deletingAttachmentId !== null || deletingLead} aria-label={`Скачать ${attachment.original_filename}`}>{downloadingId === attachment.id ? 'Скачиваем…' : <><span aria-hidden="true">↓</span><span>Скачать</span></>}</button><button className='delete-button' type='button' onClick={() => { setAttachmentMessage(null); setAttachmentDeleteError(null); setSelectedAttachment(attachment); }} disabled={deletingAttachmentId !== null || deletingLead} aria-label={`Удалить ${attachment.original_filename}`}>Удалить</button></span></li>)}</ul>}
          </section>
        </aside>
      </div>
      <ConfirmDialog
        open={selectedAttachment !== null}
        title='Удалить вложение?'
        description={<p>Файл <strong>{selectedAttachment?.original_filename}</strong> будет удалён без возможности восстановления.</p>}
        confirmLabel='Удалить'
        cancelLabel='Отмена'
        loading={deletingAttachmentId !== null}
        onConfirm={() => void confirmAttachmentDelete()}
        onCancel={() => { if (deletingAttachmentId === null) setSelectedAttachment(null); }}
      />
      <ConfirmDialog
        open={leadDeleteDialogOpen}
        title='Удалить заявку?'
        content={<div className='confirm-summary'><p>Номер заявки: <strong>#{lead.id}</strong></p><p>Клиент: <strong>{lead.name}</strong></p><p>Вложений: <strong>{attachments?.length ?? 0}</strong></p><p className='danger-warning'>Заявка и все её вложения будут удалены без возможности восстановления.</p></div>}
        confirmLabel='Удалить заявку'
        cancelLabel='Отмена'
        loading={deletingLead}
        onConfirm={() => void confirmLeadDelete()}
        onCancel={() => { if (!deletingLead) setLeadDeleteDialogOpen(false); }}
      />
    </main>
  );
}
