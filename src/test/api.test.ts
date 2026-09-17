import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadAttachment, getDownloadFilename, getLead, getLeadAttachments, getLeads, updateLeadStatus } from '../api/leads';
import { extractErrorMessage } from '../api/client';
import { triggerBlobDownload } from '../utils/download';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

beforeEach(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'false');
  window.sessionStorage.setItem('alpool_admin_access_token', 'download-token');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('API error and download helpers', () => {
  it('uses local demo data and never calls fetch when demo mode is enabled', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true');

    const leads = await getLeads();
    const lead = await getLead('1');
    const attachments = await getLeadAttachments('1');
    const updatedLead = await updateLeadStatus(1, 'contacted');

    expect(leads).toHaveLength(7);
    expect(lead.id).toBe(1);
    expect(attachments.map((item) => item.original_filename)).toEqual([
      'Техническое_задание.pdf',
      'План_участка.docx',
      'Фото_места.jpg',
      'Чертёж_чаши.dwg',
    ]);
    expect(updatedLead.status).toBe('contacted');
    await expect(downloadAttachment(attachments[0])).rejects.toThrow('Скачивание отключено в demo-preview');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('formats FastAPI validation details without object coercion', () => {
    expect(extractErrorMessage({ detail: [{ loc: ['body', 'status'], msg: 'Field required', type: 'missing' }] }, 422)).toBe('Field required');
    expect(extractErrorMessage({ detail: 'Lead not found' }, 404)).toBe('Lead not found');
  });

  it('uses the server filename when downloading a Blob and releases its object URL', async () => {
    const createObjectUrl = vi.fn(() => 'blob:test');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new Blob(['content']), {
      status: 200,
      headers: { 'Content-Disposition': "attachment; filename*=UTF-8''plan%20final.pdf" },
    }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await downloadAttachment({
      id: 4,
      lead_id: 12,
      original_filename: 'fallback.pdf',
      stored_filename: 'secret.pdf',
      content_type: 'application/pdf',
      size: 7,
      storage_path: 'secret.pdf',
      created_at: '2026-09-17T10:35:00+00:00',
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(click).toHaveBeenCalled();
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');
    expect(getDownloadFilename(new Response(null, { headers: { 'Content-Disposition': 'attachment; filename="file.jpg"' } }), 'fallback')).toBe('file.jpg');
  });

  it('can trigger a generic Blob download', () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:generic') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    triggerBlobDownload(new Blob(['data']), 'file.txt');
    expect(click).toHaveBeenCalled();
  });
});
