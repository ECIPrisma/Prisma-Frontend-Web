import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import { MENSAJE_VINCULACION_FALLIDA, BANCOS_COLOMBIA, ETIQUETA_ESTADO_PAGO } from '../../constants/pagos';
import { Wallet, RefreshCw, AlertCircle, CheckCircle, Link2, Unlink, ShieldCheck, FlaskConical } from 'lucide-react';

const MENSAJE_VINCULACION_EXITOSA = '¡Tu cuenta de cobro quedó vinculada! Ya puedes recibir pagos divididos.';
const PASOS_VERIFICACION = ['Conectando con la pasarela de pagos...', 'Verificando la cuenta con el banco...'];

const inputClass =
  'w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white';
const labelClass = 'block text-xs font-bold text-prisma-text-primary mb-1';

const formatoPorcentaje = (valor) => `${Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;
const formatoPesos = (valor) => `$${Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FORM_VACIO = { banco: '', tipoCuenta: 'AHORROS', numeroCuenta: '', titular: '' };

/**
 * HU-12 – Cuenta de cobro del proveedor y pagos en línea recibidos.
 * La pasarela (sandbox tipo Wompi) está SIMULADA: no se conecta a ningún servicio real ni mueve dinero.
 */
export const PagosProveedorPage = ({ demoraVerificacionMs = 700 }) => {
  const [cuenta, setCuenta] = useState(null);
  const [recaudos, setRecaudos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [pasoVerificacion, setPasoVerificacion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [confirmarDesvincular, setConfirmarDesvincular] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargarCuenta = () =>
    proveedorService
      .getCuentaCobro()
      .then(setCuenta)
      .catch((err) => setError(err.message || 'No fue posible consultar la cuenta de cobro'));

  const cargarRecaudos = () =>
    proveedorService
      .getRecaudosEnLinea()
      .then(setRecaudos)
      .catch(() => setRecaudos({ pagos: [], totalEnGarantia: 0, totalLiberado: 0, cantidadEnGarantia: 0, cantidadLiberados: 0 }));

  useEffect(() => {
    Promise.all([cargarCuenta(), cargarRecaudos()]).finally(() => setCargando(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const vincular = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setError(null);
    setExito(null);
    try {
      // Pasos visuales que imitan la verificación de la cuenta en la pasarela
      for (const paso of PASOS_VERIFICACION) {
        setPasoVerificacion(paso);
        await esperar(demoraVerificacionMs);
      }
      const estado = await proveedorService.vincularCuentaCobro(form);
      setCuenta(estado);
      setMostrarFormulario(false);
      setForm(FORM_VACIO);
      setExito(MENSAJE_VINCULACION_EXITOSA);
    } catch (err) {
      setError(err.message || MENSAJE_VINCULACION_FALLIDA);
    } finally {
      setPasoVerificacion(null);
      setProcesando(false);
    }
  };

  const desvincular = async () => {
    setProcesando(true);
    setError(null);
    setExito(null);
    try {
      await proveedorService.desvincularCuentaCobro();
      setConfirmarDesvincular(false);
      setExito('Tu cuenta de cobro fue desvinculada.');
      await cargarCuenta();
    } catch (err) {
      setError(err.message || 'No fue posible desvincular la cuenta de cobro');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
          <Wallet className="w-7 h-7 text-prisma-teal" />
          Cuenta de Cobro
        </h1>
        <p className="text-xs text-prisma-text-secondary mt-1">
          Vincula tu cuenta bancaria a la pasarela de pagos para recibir tu parte de cada pedido pagado en línea por los tenderos.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-[11px] flex items-center gap-2">
        <FlaskConical className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Ambiente de pruebas simulado (Wompi sandbox).</strong> No se mueve dinero real. Para simular un rechazo
          de la pasarela, usa un número de cuenta que termine en <span className="font-mono font-bold">0000</span>.
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
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
          Consultando tu cuenta de cobro...
        </div>
      ) : cuenta && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* División de cada pago */}
            <div className="bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-3 h-fit">
              <h2 className="text-sm font-bold text-prisma-text-primary">División de cada pedido</h2>
              <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Recibes</span>
                <p className="text-2xl font-bold text-prisma-teal">{formatoPorcentaje(cuenta.porcentajeProveedor)}</p>
              </div>
              <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Comisión PRISMA</span>
                <p className="text-sm font-bold text-prisma-text-primary">{formatoPorcentaje(cuenta.comisionPrismaPorcentaje)}</p>
              </div>
              <p className="text-[11px] text-prisma-text-secondary flex gap-1.5">
                <ShieldCheck className="w-4 h-4 text-prisma-teal flex-shrink-0" />
                PRISMA retiene cada pago en garantía y te lo libera cuando el tendero confirma la entrega con su PIN.
              </p>
              <p className="text-[11px] text-prisma-text-secondary">
                Wompi cobra aparte su tarifa de procesamiento (PSE desde 1.49% + $900, Nequi desde 1.79%,
                tarjetas desde 2.65% + $700); es independiente de la comisión de PRISMA.
              </p>
            </div>

            {/* Estado de la vinculación */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-prisma-text-primary">Pasarela de pagos · Wompi</h2>

              {cuenta.vinculada ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Vinculada</span>
                    {!cuenta.modoProduccion && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Modo de prueba</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Cuenta bancaria</span>
                      <p className="font-bold text-prisma-text-primary">
                        {cuenta.banco} · {cuenta.tipoCuenta === 'CORRIENTE' ? 'Corriente' : 'Ahorros'}{' '}
                        <span className="font-mono">{cuenta.numeroCuentaEnmascarado}</span>
                      </p>
                      <p className="text-[11px] text-prisma-text-secondary">{cuenta.titular}</p>
                    </div>
                    <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">ID de comercio</span>
                      <p className="font-bold text-prisma-text-primary font-mono">{cuenta.cuentaExternaId}</p>
                      <p className="text-[11px] text-prisma-text-secondary">
                        Vinculada el {cuenta.vinculadaEn ? new Date(cuenta.vinculadaEn).toLocaleString('es-CO') : '-'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700">Estás habilitado para recibir pagos divididos.</p>

                  {confirmarDesvincular ? (
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs space-y-2">
                      <p className="text-red-700 font-semibold">
                        ¿Desvincular la cuenta? Dejarás de recibir pagos divididos hasta que vincules una nueva.
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setConfirmarDesvincular(false)}
                          className="px-3 py-1.5 border border-prisma-border text-gray-600 rounded-lg hover:bg-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={desvincular}
                          disabled={procesando}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                        >
                          Sí, desvincular
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmarDesvincular(true)}
                      className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Unlink className="w-4 h-4" />
                      Desvincular cuenta
                    </button>
                  )}
                </>
              ) : mostrarFormulario ? (
                <form onSubmit={vincular} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="banco" className={labelClass}>Banco</label>
                      <select id="banco" name="banco" required value={form.banco} onChange={handleChange} className={inputClass}>
                        <option value="">Selecciona tu banco</option>
                        {BANCOS_COLOMBIA.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tipoCuenta" className={labelClass}>Tipo de cuenta</label>
                      <select id="tipoCuenta" name="tipoCuenta" value={form.tipoCuenta} onChange={handleChange} className={inputClass}>
                        <option value="AHORROS">Ahorros</option>
                        <option value="CORRIENTE">Corriente</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="numeroCuenta" className={labelClass}>Número de cuenta</label>
                      <input
                        id="numeroCuenta" name="numeroCuenta" required inputMode="numeric" pattern="[0-9 -]{6,25}"
                        maxLength={25} value={form.numeroCuenta} onChange={handleChange} className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label htmlFor="titular" className={labelClass}>Titular de la cuenta</label>
                      <input
                        id="titular" name="titular" required minLength={3} maxLength={120}
                        value={form.titular} onChange={handleChange} className={inputClass}
                      />
                    </div>
                  </div>

                  {pasoVerificacion && (
                    <p className="text-xs text-prisma-teal font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {pasoVerificacion}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setMostrarFormulario(false); setError(null); }}
                      disabled={procesando}
                      className="px-4 py-2 border border-prisma-border text-gray-600 rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={procesando}
                      className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>{procesando ? 'Verificando...' : 'Verificar y vincular'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-xs text-prisma-text-secondary">
                    Aún no tienes una cuenta de cobro vinculada. Registra la cuenta bancaria donde quieres recibir tus
                    pagos; la pasarela la verifica y solo guardamos sus últimos 4 dígitos.
                  </p>
                  <button
                    onClick={() => { setMostrarFormulario(true); setExito(null); }}
                    className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>Vincular cuenta de cobro</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* N-08: pagos en línea de los tenderos */}
          {recaudos && (
            <div className="bg-white rounded-2xl border border-prisma-border shadow-sm overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-sm font-bold text-prisma-text-primary">Pagos en línea de tenderos</h2>
                <div className="flex gap-3 text-xs">
                  <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-700 uppercase font-semibold">En garantía ({recaudos.cantidadEnGarantia})</span>
                    <p className="font-bold text-amber-800">{formatoPesos(recaudos.totalEnGarantia)}</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold">Liberado ({recaudos.cantidadLiberados})</span>
                    <p className="font-bold text-emerald-800">{formatoPesos(recaudos.totalLiberado)}</p>
                  </div>
                </div>
              </div>

              {recaudos.pagos.length === 0 ? (
                <p className="px-5 pb-5 text-xs text-prisma-text-secondary">
                  Todavía no hay pedidos pagados en línea. Aparecerán aquí cuando un tendero pague desde la app.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-prisma-surface text-prisma-text-secondary border-b border-prisma-border uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Pedido</th>
                        <th className="p-4">Tienda</th>
                        <th className="p-4">Medio</th>
                        <th className="p-4">Pagado</th>
                        <th className="p-4">Comisión PRISMA (3.5%)</th>
                        <th className="p-4">Recibes (96.5%)</th>
                        <th className="p-4">Tarifa Wompi</th>
                        <th className="p-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-prisma-border">
                      {recaudos.pagos.map((pago) => {
                        const etiqueta = ETIQUETA_ESTADO_PAGO[pago.estado] ?? { texto: pago.estado, clase: 'bg-gray-100 text-gray-700' };
                        return (
                          <tr key={pago.id} className="hover:bg-gray-50/50">
                            <td className="p-4">
                              <p className="font-mono font-bold text-prisma-text-primary">{pago.numeroPedido}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{pago.referencia}</p>
                            </td>
                            <td className="p-4 text-prisma-text-secondary">{pago.nombreTienda}</td>
                            <td className="p-4 text-prisma-text-secondary">{pago.detalleMedio}</td>
                            <td className="p-4 font-bold text-prisma-text-primary">{formatoPesos(pago.monto)}</td>
                            <td className="p-4 text-amber-600 font-bold">{formatoPesos(pago.comisionPrisma)}</td>
                            <td className="p-4 font-bold text-prisma-teal">{formatoPesos(pago.montoProveedor)}</td>
                            <td className="p-4 text-prisma-text-secondary">
                              {pago.tarifaPasarela != null ? formatoPesos(pago.tarifaPasarela) : '-'}
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
          )}
        </>
      )}
    </div>
  );
};
