import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { setUnauthorizedHandler } from '../api/client';
import type { Lead } from '../types/api';

const lead: Lead = {
  id: 12,
  created_at: '2026-09-17T10:30:00+00:00',
  name: 'Иван Петров',
  phone: '+79991234567',
  email: 'ivan@example.com',
  source: 'calculator',
  page_url: 'https://alpool.ru/calculator',
  form_type: 'pool_calculator',
  message: 'Нужен расчёт бассейна',
  status: 'new',
  utm_source: 'yandex',
  utm_medium: 'cpc',
  utm_campaign: 'summer',
  utm_term: null,
  utm_content: null,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider><App /></AuthProvider>
    </MemoryRouter>,
  );
}

function mockLeadsResponse() {
  vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]));
}

const attachment = {
  id: 4,
  lead_id: 12,
  original_filename: 'plan.pdf',
  stored_filename: 'internal-name.pdf',
  content_type: 'application/pdf',
  size: 2048,
  storage_path: 'internal-name.pdf',
  created_at: '2026-09-17T10:35:00+00:00',
};

function mockLeadDetails(attachments: unknown[] = [attachment]) {
  vi.mocked(fetch)
    .mockResolvedValueOnce(jsonResponse(lead))
    .mockResolvedValueOnce(jsonResponse(attachments));
}

beforeEach(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'false');
  window.sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  setUnauthorizedHandler(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('authentication and routing', () => {
  it('opens the real leads page with local data in demo mode without authentication or fetch', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true');

    renderApp('/leads');

    expect(await screen.findByRole('link', { name: 'Заявка 1: Алексей Воронцов' })).toBeInTheDocument();
    expect(screen.getAllByText('DEMO')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('logs in successfully and opens the leads page', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'test-token', token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse([]));
    const user = userEvent.setup();

    renderApp('/login');
    await user.type(screen.getByLabelText('Логин'), 'admin');
    await user.type(screen.getByLabelText('Пароль'), 'password');
    await user.click(screen.getByRole('button', { name: /Войти/ }));

    expect(await screen.findByRole('heading', { name: 'Заявок пока нет' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem('alpool_admin_access_token')).toBe('test-token');
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password' }),
    });
    const leadsHeaders = vi.mocked(fetch).mock.calls[1][1]?.headers as Headers;
    expect(leadsHeaders.get('Authorization')).toBe('Bearer test-token');
  });

  it('shows a friendly login error and does not save a session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: 'Invalid credentials' }, 401));
    const user = userEvent.setup();

    renderApp('/login');
    await user.type(screen.getByLabelText('Логин'), 'admin');
    await user.type(screen.getByLabelText('Пароль'), 'wrong');
    await user.click(screen.getByRole('button', { name: /Войти/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный логин или пароль.');
    expect(window.sessionStorage.getItem('alpool_admin_access_token')).toBeNull();
  });

  it('redirects an unauthenticated visitor to login', () => {
    renderApp('/leads');
    expect(screen.getByRole('heading', { name: 'Вход в админ-панель' })).toBeInTheDocument();
  });

  it('clears the session on logout', async () => {
    window.sessionStorage.setItem('alpool_admin_access_token', 'test-token');
    mockLeadsResponse();
    const user = userEvent.setup();

    renderApp('/leads');
    expect(await screen.findByRole('heading', { name: 'Заявок пока нет' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Выйти/ }));

    expect(screen.getByRole('heading', { name: 'Вход в админ-панель' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem('alpool_admin_access_token')).toBeNull();
  });

  it('clears the session and redirects after a protected 401', async () => {
    window.sessionStorage.setItem('alpool_admin_access_token', 'expired-token');
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: 'Invalid or expired token' }, 401));

    renderApp('/leads');

    expect(await screen.findByRole('heading', { name: 'Вход в админ-панель' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem('alpool_admin_access_token')).toBeNull();
  });
});

describe('lead pages', () => {
  beforeEach(() => window.sessionStorage.setItem('alpool_admin_access_token', 'test-token'));

  it('renders the empty leads state', async () => {
    mockLeadsResponse();
    renderApp('/leads');
    expect(await screen.findByRole('heading', { name: 'Заявок пока нет' })).toBeInTheDocument();
  });

  it('renders the API error state for a failed list request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: 'Temporary service failure' }, 503));
    renderApp('/leads');
    expect(await screen.findByRole('heading', { name: 'Не удалось загрузить данные' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Temporary service failure');
  });

  it('renders the lead list and contact links', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([lead]));
    renderApp('/leads');

    expect(await screen.findByRole('link', { name: 'Заявка 12: Иван Петров' })).toBeInTheDocument();
    expect(screen.getByText('Калькулятор стоимости')).toBeInTheDocument();
    expect(screen.getByText('1 заявка')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lead.phone })).toHaveAttribute('href', `tel:${lead.phone}`);
    expect(screen.getByRole('link', { name: lead.email! })).toHaveAttribute('href', `mailto:${lead.email}`);
    expect(screen.getByText('Новая')).toBeInTheDocument();
  });

  it('renders lead details and attachments', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(lead))
      .mockResolvedValueOnce(jsonResponse([{
        id: 4,
        lead_id: 12,
        original_filename: 'plan.pdf',
        stored_filename: 'internal-name.pdf',
        content_type: 'application/pdf',
        size: 2048,
        storage_path: 'internal-name.pdf',
        created_at: '2026-09-17T10:35:00+00:00',
      }]));

    renderApp('/leads/12');

    expect(await screen.findByRole('heading', { name: 'Иван Петров' })).toBeInTheDocument();
    expect(screen.getByText('Калькулятор стоимости')).toBeInTheDocument();
    expect(screen.queryByText('pool_calculator')).not.toBeInTheDocument();
    expect(screen.getByText('Нужен расчёт бассейна')).toBeInTheDocument();
    expect(screen.getByText('plan.pdf')).toBeInTheDocument();
    expect(screen.queryByText('internal-name.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('internal-name.pdf', { selector: '[title]' })).not.toBeInTheDocument();
  });

  it('opens attachment deletion confirmation and cancels without DELETE', async () => {
    mockLeadDetails();
    const user = userEvent.setup();
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить plan.pdf' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('plan.pdf');
    await user.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('deletes an attachment locally and prevents a second DELETE while pending', async () => {
    mockLeadDetails();
    const user = userEvent.setup();
    let resolveDelete!: (response: Response) => void;
    const deletePending = new Promise<Response>((resolve) => { resolveDelete = resolve; });
    vi.mocked(fetch).mockImplementationOnce(() => deletePending);
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить plan.pdf' }));
    const dialog = screen.getByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: 'Удалить' });
    await user.click(confirmButton);
    expect(confirmButton).toBeDisabled();
    await user.click(confirmButton);
    expect(fetch).toHaveBeenCalledTimes(3);

    resolveDelete(new Response(null, { status: 204 }));
    expect(await screen.findByRole('status')).toHaveTextContent('Вложение удалено');
    expect(screen.queryByText('plan.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('FILES / 0')).toBeInTheDocument();
  });

  it.each([404, 500])('keeps an attachment after DELETE %s', async (status) => {
    mockLeadDetails();
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: 'Delete failed' }, status));
    const user = userEvent.setup();
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить plan.pdf' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed');
    expect(screen.getByText('plan.pdf')).toBeInTheDocument();
    expect(screen.getByText('FILES / 1')).toBeInTheDocument();
  });

  it('shows lead deletion details and cancels without DELETE', async () => {
    mockLeadDetails();
    const user = userEvent.setup();
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить заявку' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('#12');
    expect(dialog).toHaveTextContent('Иван Петров');
    expect(dialog).toHaveTextContent('Вложений: 1');
    expect(dialog).toHaveTextContent('все её вложения');
    await user.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('deletes a lead and navigates back to the leads list', async () => {
    mockLeadDetails();
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse([]));
    const user = userEvent.setup();
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить заявку' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить заявку' }));

    expect(await screen.findByRole('heading', { name: 'Заявок пока нет' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Иван Петров' })).not.toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls[2][1]).toMatchObject({ method: 'DELETE' });
  });

  it.each([404, 500])('keeps the lead after DELETE %s', async (status) => {
    mockLeadDetails();
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: 'Delete failed' }, status));
    const user = userEvent.setup();
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить заявку' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить заявку' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed');
    expect(screen.getByRole('heading', { name: 'Иван Петров' })).toBeInTheDocument();
  });

  it('uses the existing auth flow after a lead deletion 401', async () => {
    mockLeadDetails();
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: 'Invalid or expired token' }, 401));
    const user = userEvent.setup();
    window.sessionStorage.setItem('alpool_admin_access_token', 'test-token');
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.click(screen.getByRole('button', { name: 'Удалить заявку' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить заявку' }));

    expect(await screen.findByRole('heading', { name: 'Вход в админ-панель' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem('alpool_admin_access_token')).toBeNull();
  });

  it('updates a lead status once and shows confirmation', async () => {
    const updatedLead = { ...lead, status: 'proposal' };
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(lead))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(updatedLead));
    const user = userEvent.setup();
    renderApp('/leads/12');

    await screen.findByRole('heading', { name: 'Иван Петров' });
    await user.selectOptions(screen.getByLabelText('Текущий этап заявки'), 'proposal');
    await user.click(screen.getByRole('button', { name: 'Сохранить статус' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Статус заявки сохранён.');
    expect(vi.mocked(fetch).mock.calls[2][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ status: 'proposal' }),
    });
  });
});
