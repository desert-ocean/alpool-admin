import type { Attachment, Lead, LeadStatus } from '../types/api';

const demoLeads: Lead[] = [
  {
    id: 1,
    created_at: '2026-09-16T08:42:00+03:00',
    name: 'Алексей Воронцов',
    phone: '+7 900 123-45-67',
    email: 'alexey.vorontsov@example.com',
    source: 'Форма технического задания',
    page_url: 'https://example.com/alpool-demo/technical-task',
    form_type: 'technical_task',
    message: 'Нужен прямоугольный бассейн 8×4 м для загородного дома. Участок с ограниченным подъездом, нужна консультация по чаше, фильтрации и зимней консервации. Хотелось бы получить предварительный расчёт до конца недели.',
    status: 'new',
    utm_source: 'yandex',
    utm_medium: 'cpc',
    utm_campaign: 'pools-2026',
    utm_term: 'строительство бассейна',
    utm_content: 'form-a',
  },
  {
    id: 2,
    created_at: '2026-09-15T16:18:00+03:00',
    name: 'Мария Кузнецова',
    phone: '+7 901 234-56-78',
    email: null,
    source: 'Калькулятор стоимости',
    page_url: 'https://example.com/alpool-demo/calculator',
    form_type: 'pool_calculator',
    message: 'Бассейн 6×3 м, интересует ориентировочная стоимость.',
    status: 'contacted',
    utm_source: 'google',
    utm_medium: 'organic',
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  },
  {
    id: 3,
    created_at: '2026-09-14T11:05:00+03:00',
    name: 'Илья и Екатерина Белозёровы',
    phone: '+7 902 345-67-89',
    email: 'belozerovy@example.com',
    source: 'Главная страница',
    page_url: 'https://example.com/alpool-demo/',
    form_type: 'callback',
    message: 'Рассматриваем строительство бассейна в новом доме. Подскажите, пожалуйста, какие работы нужно заложить в проект и сколько занимает монтаж.',
    status: 'calculation',
    utm_source: 'vk',
    utm_medium: 'social',
    utm_campaign: 'house-project',
    utm_term: 'бассейн для дома',
    utm_content: 'carousel-2',
  },
  {
    id: 4,
    created_at: '2026-09-12T18:27:00+03:00',
    name: 'Дмитрий Соколов',
    phone: '+7 903 456-78-90',
    email: 'd.sokolov@example.com',
    source: 'Статья',
    page_url: 'https://example.com/alpool-demo/articles/skimmer-pool',
    form_type: 'article_contact',
    message: 'Спасибо за статью про скиммерные бассейны. Пришлите, пожалуйста, предложение с двумя вариантами отделки и оборудования.',
    status: 'proposal',
    utm_source: 'telegram',
    utm_medium: 'referral',
    utm_campaign: 'expert-content',
    utm_term: null,
    utm_content: 'article-footer',
  },
  {
    id: 5,
    created_at: '2026-09-10T09:14:00+03:00',
    name: 'Анна-Мария де ла Крус',
    phone: '+7 904 567-89-01',
    email: 'anna.delacruz@example.com',
    source: 'Telegram',
    page_url: 'https://example.com/alpool-demo/contacts',
    form_type: 'messenger_callback',
    message: 'Проект согласован, готовы перейти к договору после финального замера на участке.',
    status: 'contract',
    utm_source: 'telegram',
    utm_medium: 'messenger',
    utm_campaign: 'spring-leads',
    utm_term: 'монтаж бассейна',
    utm_content: 'channel-post-14',
  },
  {
    id: 6,
    created_at: '2026-09-07T13:50:00+03:00',
    name: 'Олег',
    phone: '+7 905 678-90-12',
    email: null,
    source: 'Главная страница',
    page_url: 'https://example.com/alpool-demo/',
    form_type: 'callback',
    message: 'Пока отложили строительство до следующего сезона.',
    status: 'lost',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  },
  {
    id: 7,
    created_at: '2026-09-03T20:36:00+03:00',
    name: 'Сергей Н.',
    phone: '+7 906 789-01-23',
    email: 'sergey.n@example.com',
    source: 'Калькулятор стоимости',
    page_url: 'https://example.com/alpool-demo/calculator',
    form_type: 'pool_calculator',
    message: 'Чаша 10×4 м, переливная, глубина 1,5 м.',
    status: 'new',
    utm_source: 'yandex',
    utm_medium: 'cpc',
    utm_campaign: 'brand-search',
    utm_term: 'переливной бассейн',
    utm_content: 'ad-3',
  },
];

const demoAttachments: Attachment[] = [
  { id: 101, lead_id: 1, original_filename: 'Техническое_задание.pdf', stored_filename: 'demo-technical-task.pdf', content_type: 'application/pdf', size: 2488320, storage_path: 'demo/technical-task.pdf', created_at: '2026-09-16T08:43:00+03:00' },
  { id: 102, lead_id: 1, original_filename: 'План_участка.docx', stored_filename: 'demo-site-plan.docx', content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 786432, storage_path: 'demo/site-plan.docx', created_at: '2026-09-16T08:44:00+03:00' },
  { id: 103, lead_id: 1, original_filename: 'Фото_места.jpg', stored_filename: 'demo-site-photo.jpg', content_type: 'image/jpeg', size: 5242880, storage_path: 'demo/site-photo.jpg', created_at: '2026-09-16T08:45:00+03:00' },
  { id: 104, lead_id: 1, original_filename: 'Чертёж_чаши.dwg', stored_filename: 'demo-pool-drawing.dwg', content_type: 'application/acad', size: 12582912, storage_path: 'demo/pool-drawing.dwg', created_at: '2026-09-16T08:46:00+03:00' },
];

export function getDemoLeads(): Promise<Lead[]> {
  return Promise.resolve(demoLeads.map((lead) => ({ ...lead })));
}

export function getDemoLead(id: string): Promise<Lead> {
  const lead = demoLeads.find((item) => item.id === Number(id));
  return lead ? Promise.resolve({ ...lead }) : Promise.reject(new Error('Lead not found'));
}

export function getDemoLeadAttachments(id: string): Promise<Attachment[]> {
  return Promise.resolve(demoAttachments.filter((attachment) => attachment.lead_id === Number(id)).map((attachment) => ({ ...attachment })));
}

export function updateDemoLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  const lead = demoLeads.find((item) => item.id === id);
  if (!lead) return Promise.reject(new Error('Lead not found'));
  lead.status = status;
  return Promise.resolve({ ...lead });
}

export const DEMO_DOWNLOAD_MESSAGE = 'Скачивание отключено в demo-preview: реальные файлы не создаются.';
