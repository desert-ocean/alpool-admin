import { describe, expect, it } from 'vitest';
import { formatFormType, formatLeadCount } from '../utils/format';

describe('display formatters', () => {
  it('translates known form types into Russian labels', () => {
    expect(formatFormType('technical_task')).toBe('Техническое задание');
    expect(formatFormType('pool_calculator')).toBe('Калькулятор стоимости');
    expect(formatFormType('callback')).toBe('Обратный звонок');
    expect(formatFormType('article_contact')).toBe('Заявка из статьи');
    expect(formatFormType('messenger_callback')).toBe('Заявка из мессенджера');
  });

  it('keeps an unknown form type as a safe fallback', () => {
    expect(formatFormType('new_backend_form')).toBe('new_backend_form');
    expect(formatFormType(null)).toBe('—');
  });

  it('formats the loaded lead count with Russian declension', () => {
    expect(formatLeadCount(1)).toBe('1 заявка');
    expect(formatLeadCount(7)).toBe('7 заявок');
    expect(formatLeadCount(22)).toBe('22 заявки');
  });
});
