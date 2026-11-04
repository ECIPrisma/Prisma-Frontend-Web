import React, { useState, useEffect } from 'react';
import { proveedorService } from '../../services/api';
import { Building2, RefreshCw, AlertCircle, CheckCircle, Save } from 'lucide-react';

const CAMPOS_VACIOS = {
  razonSocial: '',
  nombreComercial: '',
  zonaCobertura: '',
  contactoNombre: '',
  contactoEmail: '',
  contactoTelefono: '',
  direccionSede: '',
  ciudad: '',
};

const aFormulario = (perfil) =>
  Object.fromEntries(Object.keys(CAMPOS_VACIOS).map((campo) => [campo, perfil?.[campo] ?? '']));

const inputClass =
  'w-full text-xs p-3 border border-prisma-border rounded-xl focus:ring-2 focus:ring-prisma-teal focus:outline-none bg-white';
const labelClass = 'block text-xs font-bold text-prisma-text-primary mb-1';

export const PerfilProveedorPage = () => {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    let cancelado = false;
    proveedorService
      .getPerfil()
      .then((data) => {
        if (cancelado) return;
        setPerfil(data);
        setForm(aFormulario(data));
      })
      .catch((err) => {
        if (!cancelado) setError(err.message || 'No fue posible consultar el perfil comercial');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setExito(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const actualizado = await proveedorService.actualizarPerfil(form);
      setPerfil(actualizado);
      setForm(aFormulario(actualizado));
      setExito('Perfil actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No fue posible actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-prisma-text-primary flex items-center gap-2">
          <Building2 className="w-7 h-7 text-prisma-teal" />
          Perfil Comercial
        </h1>
        <p className="text-xs text-prisma-text-secondary mt-1">
          Mantén actualizada la información de tu empresa, tu zona de cobertura y tus datos de contacto.
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
          Cargando perfil comercial...
        </div>
      ) : perfil && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datos administrados por Prisma (solo lectura) */}
          <div className="bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-3 h-fit">
            <h2 className="text-sm font-bold text-prisma-text-primary">Datos de la cuenta</h2>
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">NIT</span>
              <p className="text-sm font-bold text-prisma-text-primary font-mono">{perfil.nit}</p>
            </div>
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Comisión pactada</span>
              <p className="text-sm font-bold text-prisma-text-primary">{perfil.comisionPorcentaje}%</p>
            </div>
            <div className="p-3 bg-prisma-surface rounded-xl border border-prisma-border/60">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Estado</span>
              <p className="text-sm font-bold text-prisma-text-primary">{perfil.estado}</p>
            </div>
            <p className="text-[11px] text-prisma-text-secondary">
              Para cambiar el NIT o la comisión comunícate con el equipo de Prisma.
            </p>
          </div>

          {/* Formulario editable */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white rounded-2xl border border-prisma-border p-5 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-bold text-prisma-text-primary">Información comercial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Razón social</label>
                <input name="razonSocial" required maxLength={150} value={form.razonSocial} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nombre comercial</label>
                <input name="nombreComercial" required maxLength={100} value={form.nombreComercial} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Zona de cobertura</label>
                <textarea
                  name="zonaCobertura"
                  rows={2}
                  maxLength={500}
                  value={form.zonaCobertura}
                  onChange={handleChange}
                  placeholder="Ej: Bogotá: Kennedy, Bosa, Suba"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ciudad</label>
                <input name="ciudad" required maxLength={80} value={form.ciudad} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Dirección de la sede</label>
                <input name="direccionSede" maxLength={200} value={form.direccionSede} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <h2 className="text-sm font-bold text-prisma-text-primary pt-2 border-t border-prisma-border/60">Datos de contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Nombre de contacto</label>
                <input name="contactoNombre" required maxLength={100} value={form.contactoNombre} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email de contacto</label>
                <input name="contactoEmail" type="email" required maxLength={150} value={form.contactoEmail} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Teléfono de contacto</label>
                <input name="contactoTelefono" type="tel" required maxLength={20} value={form.contactoTelefono} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 bg-prisma-teal hover:bg-prisma-teal-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
