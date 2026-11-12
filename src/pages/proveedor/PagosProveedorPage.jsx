import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { proveedorService } from '../../services/api';
import { MENSAJE_VINCULACION_FALLIDA } from '../../constants/pagos';
import { Wallet, RefreshCw, AlertCircle, CheckCircle, Link2, Unlink } from 'lucide-react';

const MENSAJE_VINCULACION_EXITOSA = '¡Tu cuenta de cobro quedó vinculada! Ya puedes recibir pagos divididos.';

const formatoPorcentaje = (valor) => `${Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;

/**
 * HU-12 – Vinculación de la cuenta de cobro del proveedor con Mercado Pago (OAuth).
 */
export const PagosProveedorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Resultado que deja la página de callback al volver de Mercado Pago
  const resultadoVinculacion = location.state?.resultado;
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [confirmarDesvincular, setConfirmarDesvincular] = useState(false);
  const [error, setError] = useState(resultadoVinculacion === 'fallo' ? MENSAJE_VINCULACION_FALLIDA : null);
  const [exito, setExito] = useState(resultadoVinculacion === 'exito' ? MENSAJE_VINCULACION_EXITOSA : null);

  const cargarCuenta = () =>
    proveedorService
      .getCuentaCobro()
      .then(setCuenta)
      .catch((err) => setError(err.message || 'No fue posible consultar la cuenta de cobro'))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargarCuenta();
  }, []);

  // Se limpia el resultado del historial para que no reaparezca al recargar la página
  useEffect(() => {
    if (resultadoVinculacion) navigate(location.pathname, { replace: true, state: null });
  }, [resultadoVinculacion, location.pathname, navigate]);

  const vincular = async () => {
    setProcesando(true);
    setError(null);
    setExito(null);
    try {
      const { urlAutorizacion } = await proveedorService.iniciarVinculacionCobro();
      // Se sale de PRISMA hacia Mercado Pago; al terminar vuelve a /proveedor/pagos/callback
      window.location.assign(urlAutorizacion);
    } catch (err) {
      setError(err.message || MENSAJE_VINCULACION_FALLIDA);
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
          Vincula tu cuenta de Mercado Pago para recibir directamente tu parte de cada pedido pagado por los tenderos.
        </p>
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
            <p className="text-[11px] text-prisma-text-secondary">
              Mercado Pago descuenta además su propia tarifa de procesamiento sobre cada pago.
            </p>
          </div>

          {/* Estado de la vinculación */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-prisma-text-primary">Mercado Pago</h2>

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
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Cuenta Mercado Pago</span>
                    <p className="font-bold text-prisma-text-primary font-mono">{cuenta.cuentaExternaId}</p>
                  </div>
                  <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Vinculada el</span>
                    <p className="font-bold text-prisma-text-primary">
                      {cuenta.vinculadaEn ? new Date(cuenta.vinculadaEn).toLocaleString('es-CO') : '-'}
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
            ) : (
              <>
                <p className="text-xs text-prisma-text-secondary">
                  Aún no tienes una cuenta de cobro vinculada. Te llevaremos a Mercado Pago para que autorices a PRISMA;
                  nunca vemos tu contraseña.
                </p>
                {!cuenta.disponible && (
                  <p className="text-xs text-amber-700">
                    La vinculación con Mercado Pago todavía no está habilitada en el servidor.
                  </p>
                )}
                <button
                  onClick={vincular}
                  disabled={procesando || !cuenta.disponible}
                  className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{procesando ? 'Redirigiendo a Mercado Pago...' : 'Vincular con Mercado Pago'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
