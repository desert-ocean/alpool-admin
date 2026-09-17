import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getUserErrorMessage } from '../utils/errors';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expired = Boolean((location.state as { sessionExpired?: boolean } | null)?.sessionExpired);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/leads', { replace: true });
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, 'Не удалось выполнить вход.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-aside" aria-label="О ALPOOL">
        <div className="login-aside-inner">
          <div className="brand brand-light">
            <span className="brand-mark">A</span>
            <span><strong>ALPOOL</strong><small>ADMIN / WORKSPACE</small></span>
          </div>
          <div className="login-quote">
            <span className="eyebrow">INTERNAL OPERATIONS</span>
            <h1>Заявки под контролем.</h1>
            <p>Единое рабочее пространство для команды ALPOOL.</p>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">SECURE ACCESS</span>
          <h2>Вход в админ-панель</h2>
          <p className="muted">Используйте данные администратора для продолжения.</p>
          {expired && !error && <div className="notice notice-info" role="status">Сессия истекла. Войдите снова.</div>}
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          <form onSubmit={submit} className="login-form">
            <div className="field-group">
              <label htmlFor="username">Логин</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="field-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={pending}
              />
            </div>
            <button className="button button-primary button-wide" type="submit" disabled={pending}>
              {pending ? <><span className="spinner spinner-small" aria-hidden="true" /> Входим…</> : <>Войти <span aria-hidden="true">→</span></>}
            </button>
          </form>
          <p className="login-footnote">Доступ только для авторизованных сотрудников ALPOOL</p>
        </div>
      </section>
    </main>
  );
}
