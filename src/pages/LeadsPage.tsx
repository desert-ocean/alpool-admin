import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeads } from '../api/leads';
import { EmptyState, ErrorState, LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import type { Lead } from '../types/api';
import { getUserErrorMessage } from '../utils/errors';
import { formatDate, formatFormType, formatLeadCount } from '../utils/format';

function OptionalValue({ value }: { value: string | null }) {
  return <span className={value ? '' : 'muted-value'}>{value || '—'}</span>;
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await getLeads());
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, 'Не удалось загрузить заявки.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLeads(); }, [loadLeads]);

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <span className="eyebrow">LEAD MANAGEMENT / 01</span>
          <h1>Заявки</h1>
          <p className="page-subtitle">Входящие обращения клиентов ALPOOL</p>
          {leads && <span className="lead-count">{formatLeadCount(leads.length)}</span>}
        </div>
        <button className="button button-secondary" onClick={() => void loadLeads()} disabled={loading}>
          <span aria-hidden="true">↻</span> Обновить
        </button>
      </div>
      {loading && <LoadingState label="Загружаем заявки…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => void loadLeads()} />}
      {!loading && !error && leads?.length === 0 && (
        <EmptyState title="Заявок пока нет" description="Новые обращения появятся здесь после отправки формы на сайте." />
      )}
      {!loading && !error && leads && leads.length > 0 && (
        <section className="leads-panel" aria-label="Список заявок">
          <div className="leads-table-head" role="row">
            <span>ID / ДАТА</span><span>КЛИЕНТ</span><span>КОНТАКТЫ</span><span>ИСТОЧНИК</span><span>СТАТУС</span><span />
          </div>
          {leads.map((lead) => (
            <div className="lead-row" key={lead.id}>
              <div className="lead-id-cell"><strong>#{lead.id}</strong><time dateTime={lead.created_at}>{formatDate(lead.created_at)}</time></div>
              <div className="lead-client-cell"><Link className="lead-link" to={`/leads/${lead.id}`} aria-label={`Заявка ${lead.id}: ${lead.name}`}><strong>{lead.name}</strong></Link><span>{formatFormType(lead.form_type)}</span></div>
              <div className="lead-contact-cell"><a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()}>{lead.phone}</a><span>{lead.email ? <a href={`mailto:${lead.email}`} onClick={(event) => event.stopPropagation()}>{lead.email}</a> : <OptionalValue value={null} />}</span></div>
              <div className="lead-source-cell"><OptionalValue value={lead.source} /></div>
              <div className="lead-status-cell"><StatusBadge status={lead.status} /></div>
              <Link className="lead-open" to={`/leads/${lead.id}`} aria-label={`Открыть заявку ${lead.id}`}><span className="lead-open-label">Открыть</span><span aria-hidden="true">→</span></Link>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
