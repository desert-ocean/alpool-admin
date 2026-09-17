import { ApiError, extractErrorMessage } from '../api/client';
import type { ApiErrorBody } from '../types/api';

const knownMessages: Record<string, string> = {
  'Invalid credentials': 'Неверный логин или пароль.',
  'Authentication is not configured': 'Авторизация на сервере не настроена.',
  'Invalid or expired token': 'Сессия истекла. Войдите снова.',
  'Lead not found': 'Заявка не найдена.',
  'Attachment not found': 'Вложение не найдено.',
  'Attachment file not found': 'Файл вложения недоступен.',
};

export function getUserErrorMessage(error: unknown, fallback = 'Произошла непредвиденная ошибка.'): string {
  if (error instanceof ApiError) {
    return knownMessages[error.message] ?? error.message;
  }
  if (error && typeof error === 'object' && 'detail' in error) {
    return extractErrorMessage(error as ApiErrorBody);
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
