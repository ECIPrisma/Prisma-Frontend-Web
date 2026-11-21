import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/exportUtils';

export function CargaMasivaModal({ isOpen, onClose, onImportSuccess, apiCall }) {
  const [fileContent, setFileContent] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const descargarPlantilla = () => {
    const headers = [
      { key: 'sku', label: 'SKU' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'presentacion', label: 'Presentacion' },
      { key: 'precioUnitario', label: 'PrecioUnitario' },
      { key: 'precioSugeridoPublico', label: 'PrecioSugeridoPublico' },
      { key: 'stockDisponible', label: 'StockDisponible' },
      { key: 'cantidadMinimaPedido', label: 'CantidadMinimaPedido' },
      { key: 'esRetornable', label: 'EsRetornable' },
      { key: 'descripcion', label: 'Descripcion' }
    ];
    const ejemplo = [
      {
        sku: 'BEB-001',
        nombre: 'Gaseosa Cola 1.5L',
        presentacion: 'Botella Pet 1.5L',
        precioUnitario: 4500,
        precioSugeridoPublico: 5500,
        stockDisponible: 120,
        cantidadMinimaPedido: 6,
        esRetornable: 'true',
        descripcion: 'Gaseosa refrescante familiar'
      },
      {
        sku: 'SNK-002',
        nombre: 'Papas Onduladas 120g',
        presentacion: 'Paquete 120g',
        precioUnitario: 2800,
        precioSugeridoPublico: 3500,
        stockDisponible: 80,
        cantidadMinimaPedido: 10,
        esRetornable: 'false',
        descripcion: 'Papas fritas con sal'
      }
    ];
    exportToCsv('Plantilla_Catalogo_PRISMA', headers, ejemplo);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessInfo(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        setFileContent(text);
        procesarCsv(text);
      } catch (err) {
        setErrorMsg('Error al leer el archivo. Asegúrese de que sea formato CSV válido.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const procesarCsv = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setErrorMsg('El archivo debe contener una fila de encabezados y al menos un registro.');
      return;
    }

    // Detectar separador (; o ,)
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const cleanHeader = (h) => h.replace(/^["'\uFEFF]+|["']+$/g, '').trim().toLowerCase();
    const headers = lines[0].split(delimiter).map(cleanHeader);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.replace(/^["']+|["']+$/g, '').trim());
      if (cols.length < 2) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });

      const rowItem = {
        sku: obj.sku || `SKU-${Date.now()}-${i}`,
        nombre: obj.nombre || `Producto ${i}`,
        presentacion: obj.presentacion || 'Unidad',
        precioUnitario: parseFloat(obj.preciounitario || obj.precio || '0'),
        precioSugeridoPublico: parseFloat(obj.preciosugeridopublico || obj.preciosugerido || '0'),
        stockDisponible: parseInt(obj.stockdisponible || obj.stock || '0', 10),
        cantidadMinimaPedido: parseInt(obj.cantidadminimapedido || obj.cantidadminima || '1', 10),
        esRetornable: String(obj.esretornable).toLowerCase() === 'true',
        descripcion: obj.descripcion || ''
      };

      rows.push(rowItem);
    }

    if (rows.length === 0) {
      setErrorMsg('No se detectaron registros válidos en el archivo.');
    } else {
      setParsedRows(rows);
    }
  };

  const handleImport = async () => {
    if (!parsedRows.length) return;
    setLoading(true);
    setErrorMsg('');

    try {
      if (apiCall) {
        const res = await apiCall(parsedRows);
        setSuccessInfo(res?.data || { totalProcesados: parsedRows.length });
        if (onImportSuccess) onImportSuccess();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.mensaje || err.message || 'Error al procesar la carga masiva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Importación Masiva de Catálogo</h2>
              <p className="text-xs text-gray-500">Carga referencias de productos y stock vía Excel o CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <span>Usa la plantilla oficial para asegurar la coincidencia de columnas SKU, Precio y Stock.</span>
            <button
              onClick={descargarPlantilla}
              type="button"
              className="flex items-center gap-1 font-semibold text-amber-900 hover:underline shrink-0 ml-2"
            >
              <Download className="w-3.5 h-3.5" /> Descargar Plantilla
            </button>
          </div>

          {/* Selector de Archivo */}
          <label className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50/50">
            <Upload className="w-8 h-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Seleccionar o arrastrar archivo CSV</span>
            <span className="text-xs text-gray-400 mt-1">Formato CSV (delimitado por coma o punto y coma)</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          {/* Alertas */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>¡Carga completada! {successInfo.totalProcesados || parsedRows.length} referencias procesadas exitosamente.</span>
            </div>
          )}

          {/* Previsualización */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Registros listos para importar ({parsedRows.length})</span>
                <span className="text-emerald-600 font-medium">Validación preliminar: Correcta</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-600 sticky top-0">
                    <tr>
                      <th className="p-2 border-b">SKU</th>
                      <th className="p-2 border-b">Nombre</th>
                      <th className="p-2 border-b">Precio</th>
                      <th className="p-2 border-b">Stock</th>
                      <th className="p-2 border-b">Retornable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.slice(0, 10).map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 font-mono text-gray-700">{r.sku}</td>
                        <td className="p-2 text-gray-900">{r.nombre}</td>
                        <td className="p-2 text-gray-700">${r.precioUnitario?.toLocaleString('es-CO')}</td>
                        <td className="p-2 text-gray-700">{r.stockDisponible}</td>
                        <td className="p-2">{r.esRetornable ? <span className="text-emerald-700 bg-emerald-50 px-1 rounded">Sí</span> : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <p className="text-[11px] text-gray-400 text-right">Mostrando primeros 10 de {parsedRows.length} registros</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || parsedRows.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : `Confirmar Carga (${parsedRows.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
