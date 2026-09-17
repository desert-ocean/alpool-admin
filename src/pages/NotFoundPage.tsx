import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div><span className="eyebrow">ERROR / 404</span><h1>Страница не найдена</h1><p className="muted">Такого маршрута нет в рабочем пространстве ALPOOL.</p><Link className="button button-primary" to="/leads">Вернуться к заявкам</Link></div>
    </main>
  );
}
