import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

const MIN = 10000;
const MAX = 1000000;

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function Wallet() {
  const { user, transactions, recharge, loading } = useUser();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const recentRecharges = transactions.filter((t) => t.type === 'recharge').slice(0, 5);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });
    setSubmitting(true);

    const parsed = parseInt(amount, 10);

    if (!amount || isNaN(parsed) || parsed <= 0) {
      setStatus({ type: 'error', message: 'El monto debe ser mayor a cero.' });
      setSubmitting(false);
      return;
    }

    if (parsed < MIN || parsed > MAX) {
      setStatus({
        type: 'error',
        message: `El monto debe estar entre ${fmt(MIN)} y ${fmt(MAX)}.`,
      });
      setSubmitting(false);
      return;
    }

    try {
      await recharge(parsed);
      setStatus({
        type: 'success',
        message: `Recarga de ${fmt(parsed)} realizada exitosamente. Tu saldo ha sido actualizado.`,
      });
      setAmount('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al recargar';
      setStatus({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className='panel__main'>
      <div>
        <h1 className='panel__heading'>Billetera</h1>
        <p className='panel__subheading'>
          Recarga tu saldo virtual para realizar contribuciones a campañas.
        </p>
      </div>

      {/* Balance card */}
      <div className='panel__card'>
        <p className='panel__stat-label'>Saldo disponible</p>
        <p className='panel__stat-value'>{fmt(user?.balance ?? 0)}</p>
      </div>

      {/* Recharge form */}
      <div className='panel__card' style={{ maxWidth: 480 }}>
        <h2 className='panel__card-title'>Ingresar saldo</h2>

        {status.type && (
          <div
            className={`panel__alert panel__alert--${status.type}`}
            style={{ marginBottom: '1.25rem' }}
          >
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <p style={{ margin: 0 }}>{status.message}</p>
          </div>
        )}

        <form onSubmit={handleRecharge} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              htmlFor='recharge-amount'
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#71717a',
                marginBottom: '0.45rem',
              }}
            >
              Monto a recargar (COP)
            </label>
            <input
              id='recharge-amount'
              type='number'
              min={MIN}
              max={MAX}
              step={1000}
              value={amount}
              placeholder={`${MIN.toLocaleString('es-CO')} – ${MAX.toLocaleString('es-CO')}`}
              onChange={(e) => {
                setAmount(e.target.value);
                setStatus({ type: null, message: '' });
              }}
              className='amount-input'
              disabled={submitting}
            />
            <p style={{ fontSize: '0.68rem', color: '#a1a1aa', marginTop: '0.4rem' }}>
              Mínimo {fmt(MIN)} · Máximo {fmt(MAX)}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type='submit' disabled={!amount || submitting} className='panel__submit'>
              {submitting ? 'Recargando...' : 'Recargar'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent recharges */}
      {recentRecharges.length > 0 && (
        <div className='panel__card'>
          <h2 className='panel__card-title'>Recargas recientes</h2>
          <div className='panel__list'>
            {recentRecharges.map((t) => (
              <div key={t.id} className='panel__list-row'>
                <div>
                  <p className='panel__list-label'>Recarga de saldo</p>
                  <p className='panel__list-sub'>{fmtDate(t.date)}</p>
                </div>
                <span className='panel__list-amount panel__list-amount--credit'>
                  +{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}