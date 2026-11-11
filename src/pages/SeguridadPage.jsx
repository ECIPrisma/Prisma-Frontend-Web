import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { AlertCircle, CheckCircle, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';

const codigoValido = (codigo) => /^\d{6}$/.test(codigo);
const inputClass =
  'w-full text-sm p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white';
const labelClass = 'block text-xs font-bold text-prisma-text-primary mb-1';

export const SeguridadPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [habilitado, setHabilitado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [configuracion, setConfiguracion] = useState(null);
  const [qr, setQr] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmandoDesactivacion, setConfirmandoDesactivacion] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let cancelado = false;
    authService.getTotpStatus()
      .then((data) => {
        if (typeof data?.enabled !== 'boolean') {
          throw new Error('El servidor devolvió un estado de autenticación en dos pasos no válido.');
        }
        if (!cancelado) setHabilitado(data.enabled);
      })
      .catch((err) => {
        if (!cancelado) setError(err.message || 'No fue posible consultar la autenticación en dos pasos.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const limpiarConfiguracion = () => {
    setConfiguracion(null);
    setQr('');
    setCodigo('');
  };

  const handleIniciarConfiguracion = async () => {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      const data = await authService.setupTotp();
      if (!data?.secret || !data?.otpauthUri) {
        throw new Error('El servidor no devolvió los datos necesarios para configurar TOTP.');
      }
      setConfiguracion({ secret: data.secret, otpauthUri: data.otpauthUri });
      try {
        setQr(await QRCode.toDataURL(data.otpauthUri, { width: 224, margin: 2 }));
      } catch {
        setQr('');
        setError('No se pudo generar el código QR. Puedes ingresar el secreto manualmente.');
      }
    } catch (err) {
      setError(err.message || 'No fue posible iniciar la configuración.');
    } finally {
      setOcupado(false);
    }
  };

  const handleActivar = async (event) => {
    event.preventDefault();
    if (!codigoValido(codigo)) {
      setError('Ingresa un código de 6 dígitos numéricos.');
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await authService.enableTotp(codigo);
      limpiarConfiguracion();
      setHabilitado(true);
      logout();
      navigate('/login', {
        replace: true,
        state: { message: 'La autenticación en dos pasos se activó. Por seguridad, debes volver a iniciar sesión.' },
      });
    } catch (err) {
      setCodigo('');
      setError(err.message || 'No fue posible activar la autenticación en dos pasos.');
    } finally {
      setOcupado(false);
    }
  };

  const handleDesactivar = async (event) => {
    event.preventDefault();
    if (!codigoValido(codigo)) {
      setError('Ingresa un código de 6 dígitos numéricos.');
      return;
    }
    setOcupado(true);
    setError('');
    try {
      await authService.disableTotp(password, codigo);
      setHabilitado(false);
      setConfirmandoDesactivacion(false);
      setAviso('La autenticación en dos pasos se desactivó.');
    } catch (err) {
      setError(err.message || 'No fue posible desactivar la autenticación en dos pasos.');
    } finally {
      setPassword('');
      setCodigo('');
      setOcupado(false);
    }
  };

  const handleCancelarDesactivacion = () => {
    setConfirmandoDesactivacion(false);
    setPassword('');
    setCodigo('');
    setError('');
  };

  const handleCancelarConfiguracion = () => {
    limpiarConfiguracion();
    setError('');
    setAviso('');
  };

  const handleCodigoChange = (event) => {
    setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6));
    setError('');
  };

  return (
    <main className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-prisma-teal" />
          Seguridad de la cuenta
        </h1>
        <p className="text-sm text-prisma-text-secondary mt-1">
          Protege tu cuenta con un código temporal de Google Authenticator u otra aplicación compatible.
        </p>
      </header>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {aviso && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{aviso}</span>
        </div>
      )}

      {cargando ? (
        <div className="p-12 text-center text-sm text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border" role="status">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
          Consultando configuración de seguridad...
        </div>
      ) : (
        <section className="bg-white rounded-2xl border border-prisma-border p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-prisma-text-primary">Autenticación en dos pasos (TOTP)</h2>
              <p className="text-sm text-prisma-text-secondary mt-1">
                Estado: <strong>{habilitado === null ? 'No disponible' : habilitado ? 'Activada' : 'Desactivada'}</strong>
              </p>
            </div>
            {habilitado === false && !configuracion && (
              <button
                type="button"
                disabled={ocupado}
                onClick={handleIniciarConfiguracion}
                className="px-4 py-3 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {ocupado ? 'Preparando...' : 'Activar autenticación en dos pasos'}
              </button>
            )}
            {habilitado === true && !confirmandoDesactivacion && (
              <button
                type="button"
                onClick={() => {
                  setConfirmandoDesactivacion(true);
                  setAviso('');
                }}
                className="px-4 py-3 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-sm font-bold"
              >
                Desactivar autenticación en dos pasos
              </button>
            )}
          </div>

          {configuracion && (
            <div className="border-t border-prisma-border pt-5 space-y-5">
              <div>
                <h3 className="font-bold text-prisma-text-primary">Vincula tu aplicación</h3>
                <p className="text-sm text-prisma-text-secondary mt-1">
                  Escanea este código QR con tu aplicación de autenticación. Si no puedes escanearlo, ingresa el secreto manualmente.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {qr && <img src={qr} alt="Código QR de configuración TOTP" className="w-56 h-56 max-w-full border border-prisma-border rounded-xl p-2" />}
                <div className="space-y-2 min-w-0">
                  <p className={labelClass}>Secreto para ingreso manual</p>
                  <code className="block break-all select-all rounded-lg bg-slate-100 p-3 text-sm font-mono" aria-label="Secreto TOTP">
                    {configuracion.secret}
                  </code>
                </div>
              </div>
              <form onSubmit={handleActivar} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="codigoActivacion" className={labelClass}>Código de 6 dígitos</label>
                  <input
                    id="codigoActivacion"
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={codigo}
                    onChange={handleCodigoChange}
                    className={inputClass}
                    placeholder="000000"
                    aria-describedby="codigoActivacionAyuda"
                  />
                  <p id="codigoActivacionAyuda" className="text-xs text-prisma-text-secondary mt-1">
                    Escribe el código que muestra tu aplicación para confirmar la configuración.
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={handleCancelarConfiguracion} className="px-4 py-3 border border-prisma-border rounded-xl text-sm font-semibold">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={ocupado || !codigoValido(codigo)}
                    className="px-4 py-3 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {ocupado ? 'Activando...' : 'Confirmar y activar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {habilitado === true && confirmandoDesactivacion && (
            <form onSubmit={handleDesactivar} className="border-t border-prisma-border pt-5 space-y-4 max-w-md">
              <p className="text-sm text-prisma-text-secondary">
                Confirma tu contraseña y el código actual de la aplicación para desactivar esta protección.
              </p>
              <div>
                <label htmlFor="passwordDesactivacion" className={labelClass}>Contraseña actual</label>
                <input
                  id="passwordDesactivacion"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="codigoDesactivacion" className={labelClass}>Código de 6 dígitos</label>
                <input
                  id="codigoDesactivacion"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={codigo}
                  onChange={handleCodigoChange}
                  className={inputClass}
                  placeholder="000000"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button type="button" onClick={handleCancelarDesactivacion} disabled={ocupado} className="px-4 py-3 border border-prisma-border rounded-xl text-sm font-semibold disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ocupado || !password || !codigoValido(codigo)}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {ocupado ? 'Desactivando...' : 'Confirmar desactivación'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
      <div className="flex items-start gap-2 text-xs text-prisma-text-secondary">
        <KeyRound className="w-4 h-4 flex-shrink-0 mt-0.5" />
        El secreto de configuración y los códigos solo se mantienen temporalmente en esta página.
      </div>
    </main>
  );
};
