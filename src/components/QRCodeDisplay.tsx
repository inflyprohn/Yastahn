import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Printer, Check, ExternalLink, QrCode as QrIcon } from 'lucide-react';
import { Business } from '../types';

interface QRCodeDisplayProps {
  business: Business;
  onNavigateToPublicMenu?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  business,
  onNavigateToPublicMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Determinar la URL pública: configurable con PUBLIC_APP_URL en prod o window.location.origin en preview
  const appOrigin =
    typeof window !== 'undefined'
      ? (import.meta as any).env?.VITE_PUBLIC_APP_URL || window.location.origin
      : 'https://yasta.hn';
  const appBasePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  const publicUrl = new URL(
    `${appBasePath}c/${encodeURIComponent(business.slug)}`,
    `${appOrigin.replace(/\/$/, '')}/`
  ).toString();

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        publicUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#1c1917', // stone-900
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('Error generando código QR:', error);
        }
      );
    }
  }, [publicUrl, business.slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const pngUrl = canvasRef.current.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_Yasta_${business.slug}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-amber-700" />
            <h3 className="text-lg font-bold text-stone-900">Código QR del Negocio</h3>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Enlace permanente para clientes en mesas, mostrador o volantes de{' '}
            <span className="font-semibold text-stone-900">{business.nombre}</span>.
          </p>
        </div>

        {onNavigateToPublicMenu && (
          <button
            onClick={onNavigateToPublicMenu}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver menú público (/c/{business.slug})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Canvas QR Real */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border border-stone-200/80">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200">
            <canvas ref={canvasRef} className="rounded-lg w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]" />
          </div>
          <p className="text-[11px] font-mono text-stone-500 mt-3 text-center">
            ID permanente: {business.slug}
          </p>
        </div>

        {/* Acciones y detalles */}
        <div className="md:col-span-7 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Enlace público directo al menú
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-800 select-all focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Los clientes que escaneen este código verán únicamente el catálogo, precios y pedidos de este negocio.
            </p>
          </div>

          {/* PIN de fidelidad para ver el menú */}
          {business.pinAccesoMenu && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-amber-950 block">PIN de fidelidad de este local:</span>
                <span className="text-[11px] text-stone-600">Proporcione este PIN a sus clientes para que puedan desbloquear y ver el menú.</span>
              </div>
              <span className="font-mono text-base font-black text-amber-900 bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 tracking-widest shrink-0 shadow-xs">
                {business.pinAccesoMenu}
              </span>
            </div>
          )}

          {/* Botones de descarga e impresión */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleDownloadPNG}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Descargar PNG (Alta resolución)
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              Imprimir afiche de mesa
            </button>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600 space-y-1">
            <p className="font-semibold text-stone-900">Consejos para el mostrador:</p>
            <p>
              • Coloque el afiche impreso en cada mesa o junto a la caja registradora.
            </p>
            <p>
              • El código es permanente: seguirá funcionando incluso si cambia el nombre visible o actualiza los precios del menú.
            </p>
          </div>
        </div>
      </div>

      {/* Modal / Vista de Impresión del Afiche de Mesa */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h4 className="text-base font-bold text-stone-900">Vista previa del afiche imprimible</h4>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            {/* Hoja de afiche para mesa */}
            <div
              id="printable-flyer"
              className="my-4 p-8 border-2 border-stone-800 rounded-2xl text-center bg-stone-50 space-y-4"
            >
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.nombre}
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-stone-300"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-stone-900 text-white font-bold text-xl flex items-center justify-center mx-auto">
                  {business.nombre.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {business.nombre}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">{business.direccion}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-300 inline-block shadow-sm">
                <canvas
                  ref={(canvas) => {
                    if (canvas) {
                      QRCode.toCanvas(canvas, publicUrl, {
                        width: 220,
                        margin: 1,
                        color: { dark: '#000000', light: '#ffffff' },
                        errorCorrectionLevel: 'H',
                      });
                    }
                  }}
                  className="w-[180px] h-[180px] mx-auto"
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">
                  ¡Escanea para ver nuestro menú y ordenar!
                </p>
                <p className="text-xs text-stone-600">
                  Haz tu pedido desde tu celular y recógelo calientito en el mostrador.
                </p>
                {business.pinAccesoMenu && (
                  <div className="bg-amber-100 border border-amber-300 rounded-lg py-1 px-3 inline-block my-1 text-xs">
                    <span className="text-stone-700 font-semibold">PIN de fidelidad para ordenar: </span>
                    <strong className="font-mono font-black text-amber-950 text-sm tracking-wider">
                      {business.pinAccesoMenu}
                    </strong>
                  </div>
                )}
                <p className="text-[10px] font-mono text-stone-400 mt-1">
                  {publicUrl}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500">
                Impulsado por <strong className="text-stone-800">Yasta</strong> · Menús y pedidos en Honduras
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                Volver
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Imprimir ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
