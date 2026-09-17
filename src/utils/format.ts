const FORM_TYPE_LABELS: Record<string, string> = {
  technical_task: 'Техническое задание',
  pool_calculator: 'Калькулятор стоимости',
  callback: 'Обратный звонок',
  article_contact: 'Заявка из статьи',
  messenger_callback: 'Заявка из мессенджера',
};

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/zip': 'ZIP',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

export function formatFormType(value: string | null | undefined): string {
  if (!value) return '—';
  return FORM_TYPE_LABELS[value] ?? value;
}

export function formatLeadCount(count: number): string {
  const remainder = count % 100;
  if (remainder >= 11 && remainder <= 14) return `${count} заявок`;
  if (count % 10 === 1) return `${count} заявка`;
  if (count % 10 >= 2 && count % 10 <= 4) return `${count} заявки`;
  return `${count} заявок`;
}

export function formatFileType(value: string | null): string {
  if (!value) return '';
  return FILE_TYPE_LABELS[value] ?? 'Файл';
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата неизвестна';
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Размер неизвестен';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
