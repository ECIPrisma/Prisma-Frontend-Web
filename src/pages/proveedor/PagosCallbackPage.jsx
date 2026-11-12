import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { proveedorService } from '../../services/api';

/**
 * HU-12: Mercado Pago redirige aquí después de que el proveedor autoriza o cancela.
 * Se reenvían code/state al backend (con el JWT del proveedor) y se vuelve a /proveedor/pagos
 * sin dejar el code en la URL.
 */
export const PagosCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const procesado = useRef(false);

  useEffect(() => {
    // El code y el state son de un solo uso: evita el doble envío del modo estricto de React
    if (procesado.current) return;
    procesado.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    const volver = (resultado) => navigate('/proveedor/pagos', { replace: true, state: { resultado } });

    proveedorService
      .completarVinculacionCobro({ code, state, error })
      .then(() => volver('exito'))
      .catch(() => volver('fallo'));
  }, [params, navigate]);

  return (
    <div className="p-8">
      <div className="p-12 text-center text-xs text-prisma-text-secondary bg-white rounded-2xl border border-prisma-border">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-prisma-teal" />
        Confirmando la vinculación con Mercado Pago...
      </div>
    </div>
  );
};
