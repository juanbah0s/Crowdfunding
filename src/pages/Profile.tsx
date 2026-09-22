import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

type FloatingFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
};

function FloatingField({ id, label, type = 'text', value, onChange }: FloatingFieldProps) {
  return (
    <div className='field'>
      <input
        id={id}
        type={type}
        placeholder=' '
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='field__input'
      />
      <label htmlFor={id} className='field__label'>
        {label}
      </label>
    </div>
  );
}

export function Profile() {
  const { user, updateProfile, loading } = useUser();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const canSave = name.trim() !== '' && email.trim() !== '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: null, message: '' });

    if (!name.trim() || !email.trim()) {
      setStatus({ type: 'error', message: 'Por favor completa todos los campos obligatorios antes de continuar.' });
      setSubmitting(false);
      return;
    }

    try {
      await updateProfile(name.trim(), email.trim());
      setStatus({ type: 'success', message: 'Perfil actualizado correctamente. Los cambios ya se reflejan en tu cuenta.' });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al actualizar perfil';
      setStatus({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className='panel__main'>
      <div>
        <h1 className='panel__heading'>Editar perfil</h1>
        <p className='panel__subheading'>Actualiza tu nombre y correo electrónico.</p>
      </div>

      <div className='panel__card' style={{ maxWidth: 480 }}>
        {status.type && (
          <div className={`panel__alert panel__alert--${status.type}`} style={{ marginBottom: '1.25rem' }}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <p style={{ margin: 0 }}>{status.message}</p>
          </div>
        )}

        <form
          onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <FloatingField
            id='profile-name'
            label='Nombre completo'
            value={name}
            onChange={(v) => { setName(v); setStatus({ type: null, message: '' }); }}
          />
          <FloatingField
            id='profile-email'
            label='Correo electrónico'
            type='email'
            value={email}
            onChange={(v) => { setEmail(v); setStatus({ type: null, message: '' }); }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type='submit' disabled={!canSave || submitting} className='panel__submit'>
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#a1a1aa', maxWidth: 480 }}>
        Los campos marcados son obligatorios. El correo electrónico se usará para notificaciones y acceso a tu cuenta.
      </p>
    </main>
  );
}