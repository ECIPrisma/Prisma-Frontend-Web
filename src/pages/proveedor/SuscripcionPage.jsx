import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import {
  MENSAJE_PAGO_RECHAZADO,
  ESTADO_SUSCRIPCION,
  ESTADO_PAGO_SUSCRIPCION,
  DATOS_PRUEBA,
  BANCOS_PSE,
} from '../../constants/pagos';
import { Wallet, RefreshCw, AlertCircle, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const inputClass =
  'w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white';
const labelClass = 'block text-xs font-bold text-prisma-text-primary mb-1';

const MEDIOS = [
  { id: 'NEQUI', titulo: 'Nequi', subtitulo: 'Celular' },
  { id: 'PSE', titulo: 'PSE', subtitulo: 'Débito bancario' },
  { id: 'TARJETA', titulo: 'Tarjeta', subtitulo: 'Crédito / débito' },
];

const PASOS = {
  NEQUI: 'Esperando aprobación en la app Nequi...',
  PSE: 'Autorizando el débito con tu banco...',
  TARJETA: 'Validando la tarjeta con el banco emisor...',
};

const FORM_VACIO = {
  celular: '',
  banco: '',
  tipoPersona: 'JURIDICA',
  documento: '',
  numeroTarjeta: '',
  titular: '',
  vencimiento: '',
  cvv: '',
  cuotas: '1',
};

const formatoPesos = (valor) => `$${Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
const formatoFecha = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-CO') : '-');
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Arma la solicitud para el backend. El CVV solo se valida en el navegador: nunca se envía. */
export const construirSolicitud = (medio, form) => {
  if (medio === 'NEQUI') return { medio, celular: form.celular };
  if (medio === 'PSE') return { medio, banco: form.banco, tipoPersona: form.tipoPersona, documento: form.documento };
  return {
    medio,
    numeroTarjeta: form.numeroTarjeta,
    titular: form.titular,
    vencimiento: form.vencimiento,
    cuotas: Number(form.cuotas) || 1,
  };
};

/**
 * MVP – El distribuidor (proveedor) paga su suscripción mensual Prisma Pro a PRISMA.
 * Pasarela SIMULADA (sandbox tipo Wompi): no se mueve dinero real.
 */
export const SuscripcionPage = ({ demoraPasosMs = 700 }) => {
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [medio, setMedio] = useState('NEQUI');
  const [form, setForm] = useState(FORM_VACIO);
  const [paso, setPaso] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [detalleError, setDetalleError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargar = () =>
    proveedorService
      .getSuscripcion()
      .then(setSuscripcion)
      .catch((err) => setError(err.message || 'No fue posible consultar tu suscripción'));

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const usarDatosPrueba = () => {
    if (medio === 'NEQUI') setForm({ ...form, celular: DATOS_PRUEBA.NEQUI.aprueba });
    if (medio === 'PSE') setForm({ ...form, banco: DATOS_PRUEBA.PSE.aprueba, documento: '8600001231' });
    if (medio === 'TARJETA') {
      setForm({ ...form, numeroTarjeta: DATOS_PRUEBA.TARJETA.aprueba, titular: 'COCA-COLA FEMSA', vencimiento: '12/30', cvv: '123' });
    }
  };

  const pagar = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setError(null);
    setDetalleError(null);
    setExito(null);
    try {
      setPaso('Conectando con la pasarela de pagos...');
      await esperar(demoraPasosMs);
      setPaso(PASOS[medio]);
      const pago = await proveedorService.pagarSuscripcion(construirSolicitud(medio, form));
      if (pago.aprobado) {
        setExito(`Pago aprobado. Tu suscripción Prisma Pro está activa hasta el ${formatoFecha(pago.periodoHasta)}.`);
        setForm(FORM_VACIO);
      } else {
        setError(MENSAJE_PAGO_RECHAZADO);
        setDetalleError(pago.motivoRechazo);
      }
      await cargar();
    } catch (err) {
      // Datos inválidos (400) o pasarela no disponible / circuito abierto (503)
      setError(err.message || MENSAJE_PAGO_RECHAZADO);
    } finally {
      setPaso(null);
      setProcesando(false);
    }
  };

  const estado = suscripcion ? ESTADO_SUSCRIPCION[suscripcion.estado] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
          <Wallet className="w-7 h-7 text-prisma-teal" />
          Suscripción Prisma Pro
        </h1>
        <p className="text-xs text-prisma-text-secondary mt-1">
          Tu plan mensual de distribuidor en PRISMA. Págalo en línea con Nequi, PSE o tarjeta.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">{error}</p>
            {detalleError && <p className="mt-0.5 text-red-600">{detalleError}</p>}
          </div>
        </div>
      )}

      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{exito}</span>
        </div>
      )}

      {cargando ? (
        <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
          Consultando tu suscripción...
        </div>
      ) : suscripcion && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan */}
            <div className="bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-3 h-fit">
              <h2 className="text-sm font-bold text-prisma-text-primary">{suscripcion.nombrePlan}</h2>
              <div>
                <p className="text-3xl font-bold text-prisma-teal">{formatoPesos(suscripcion.precioMensual)}</p>
                <p className="text-[11px] text-prisma-text-secondary">al mes, IVA incluido</p>
              </div>
              <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60 text-[11px] space-y-1">
                <div className="flex justify-between"><span>Valor sin IVA</span><span className="font-bold">{formatoPesos(suscripcion.valorNeto)}</span></div>
                <div className="flex justify-between"><span>IVA (19%)</span><span className="font-bold">{formatoPesos(suscripcion.valorIva)}</span></div>
              </div>
              <ul className="space-y-1.5">
                {suscripcion.beneficios.map((b) => (
                  <li key={b} className="text-xs text-prisma-text-secondary flex gap-1.5">
                    <CheckCircle className="w-4 h-4 text-prisma-teal flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Estado y pago */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${estado?.clase ?? 'bg-gray-100 text-gray-700'}`}>
                  {estado?.texto ?? suscripcion.estado}
                </span>
                <span className="text-xs text-prisma-text-secondary">
                  {suscripcion.estado === 'ACTIVA' &&
                    `Vigente hasta el ${formatoFecha(suscripcion.vigenteHasta)} (${suscripcion.diasRestantes} días). Si pagas ahora, se suma un mes más.`}
                  {suscripcion.estado === 'VENCIDA' &&
                    `Venció el ${formatoFecha(suscripcion.vigenteHasta)}. Paga un mes para reactivarla.`}
                  {suscripcion.estado === 'SIN_SUSCRIPCION' && 'Aún no has activado tu plan. Paga el primer mes para empezar.'}
                </span>
              </div>

              <form onSubmit={pagar} className="space-y-4">
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Medio de pago">
                  {MEDIOS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMedio(m.id)}
                      aria-pressed={medio === m.id}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                        medio === m.id
                          ? 'border-prisma-teal border-2 bg-prisma-teal/10'
                          : 'border-prisma-border bg-prisma-surface hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-prisma-text-primary">{m.titulo}</p>
                      <p className="text-[11px] text-prisma-text-secondary">{m.subtitulo}</p>
                    </button>
                  ))}
                </div>

                {medio === 'NEQUI' && (
                  <div>
                    <label htmlFor="celular" className={labelClass}>Celular asociado a Nequi</label>
                    <input id="celular" name="celular" required inputMode="numeric" maxLength={10}
                      value={form.celular} onChange={handleChange} className={`${inputClass} font-mono`} />
                  </div>
                )}

                {medio === 'PSE' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="banco" className={labelClass}>Banco</label>
                      <select id="banco" name="banco" required value={form.banco} onChange={handleChange} className={inputClass}>
                        <option value="">Selecciona tu banco</option>
                        {BANCOS_PSE.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tipoPersona" className={labelClass}>Tipo de persona</label>
                      <select id="tipoPersona" name="tipoPersona" value={form.tipoPersona} onChange={handleChange} className={inputClass}>
                        <option value="JURIDICA">Jurídica</option>
                        <option value="NATURAL">Natural</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="documento" className={labelClass}>NIT / documento</label>
                      <input id="documento" name="documento" required inputMode="numeric" maxLength={15}
                        value={form.documento} onChange={handleChange} className={`${inputClass} font-mono`} />
                    </div>
                  </div>
                )}

                {medio === 'TARJETA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label htmlFor="numeroTarjeta" className={labelClass}>Número de la tarjeta</label>
                      <input id="numeroTarjeta" name="numeroTarjeta" required inputMode="numeric" maxLength={23} autoComplete="off"
                        value={form.numeroTarjeta} onChange={handleChange} className={`${inputClass} font-mono`} />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="titular" className={labelClass}>Nombre como aparece en la tarjeta</label>
                      <input id="titular" name="titular" required maxLength={80}
                        value={form.titular} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="vencimiento" className={labelClass}>Vence (MM/AA)</label>
                      <input id="vencimiento" name="vencimiento" required placeholder="MM/AA" maxLength={5} pattern="\d{2}/\d{2}"
                        value={form.vencimiento} onChange={handleChange} className={`${inputClass} font-mono`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="cvv" className={labelClass}>CVV</label>
                        <input id="cvv" name="cvv" type="password" required inputMode="numeric" maxLength={4} pattern="\d{3,4}" autoComplete="off"
                          value={form.cvv} onChange={handleChange} className={`${inputClass} font-mono`} />
                      </div>
                      <div>
                        <label htmlFor="cuotas" className={labelClass}>Cuotas</label>
                        <select id="cuotas" name="cuotas" value={form.cuotas} onChange={handleChange} className={inputClass}>
                          {[1, 2, 3, 6, 12].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button type="submit" disabled={procesando}
                    className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{procesando ? 'Procesando...' : `Pagar ${formatoPesos(suscripcion.precioMensual)}`}</span>
                  </button>
                </div>

                {paso && (
                  <p className="text-xs text-prisma-teal font-semibold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {paso}
                  </p>
                )}
                <p className="text-[11px] text-gray-400">
                  Procesado de forma segura por Wompi. PRISMA nunca guarda el número completo de tu tarjeta ni el CVV.
                </p>
              </form>
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
            <div className="p-5">
              <h2 className="text-sm font-bold text-prisma-text-primary">Historial de pagos</h2>
            </div>
            {suscripcion.pagos.length === 0 ? (
              <p className="px-5 pb-5 text-xs text-prisma-text-secondary">Todavía no has realizado pagos de tu suscripción.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Referencia</th>
                      <th className="p-4">Medio</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Período</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-prisma-border">
                    {suscripcion.pagos.map((p) => {
                      const etiqueta = ESTADO_PAGO_SUSCRIPCION[p.estado] ?? { texto: p.estado, clase: 'bg-gray-100 text-gray-700' };
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="p-4 text-prisma-text-secondary">
                            {p.creadoEn ? new Date(p.creadoEn).toLocaleString('es-CO') : '-'}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-prisma-text-primary">{p.referencia}</td>
                          <td className="p-4 text-prisma-text-secondary">{p.detalleMedio}</td>
                          <td className="p-4 font-bold text-prisma-text-primary">{formatoPesos(p.monto)}</td>
                          <td className="p-4 text-prisma-text-secondary">
                            {p.periodoDesde ? `${formatoFecha(p.periodoDesde)} – ${formatoFecha(p.periodoHasta)}` : '-'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${etiqueta.clase}`}>{etiqueta.texto}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
