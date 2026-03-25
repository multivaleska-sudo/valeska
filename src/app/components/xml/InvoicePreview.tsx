import React from "react";
import {
  MapPin,
  Calendar,
  Coins,
  User,
  Fingerprint,
  Edit3,
  BadgeDollarSign,
} from "lucide-react";

interface InvoicePreviewProps {
  invoiceData: any;
  handleDescriptionChange: (index: number, newValue: string) => void;
}

const EditableDescription = ({
  initialValue,
  onValueChange,
}: {
  initialValue: string;
  onValueChange: (val: string) => void;
}) => {
  const [text, setText] = React.useState(initialValue);
  const isFocused = React.useRef(false);

  React.useEffect(() => {
    if (!isFocused.current) {
      setText(initialValue);
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onValueChange(e.target.value);
  };

  return (
    <textarea
      rows={4}
      value={text}
      onFocus={() => (isFocused.current = true)}
      onBlur={() => {
        isFocused.current = false;
        setText(initialValue);
      }}
      onChange={handleChange}
      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl p-4 text-base font-bold text-slate-800 uppercase leading-relaxed outline-none transition-all resize-y group-hover/input:border-slate-200 shadow-inner"
    />
  );
};

export function InvoicePreview({
  invoiceData,
  handleDescriptionChange,
}: InvoicePreviewProps) {
  return (
    <div className="h-full w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-8 custom-scrollbar relative">
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
        <div className="space-y-2 flex-1">
          <h3 className="text-3xl font-black text-slate-900 uppercase leading-none">
            {invoiceData.emisor_razon}
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 flex items-center gap-2 font-medium italic mt-2">
              <MapPin size={16} className="shrink-0 text-blue-500" />{" "}
              {invoiceData.emisor_direccion}
            </p>
          </div>
        </div>

        <div className="border-[4px] border-slate-900 p-6 text-center rounded-lg min-w-[320px] shrink-0">
          <p className="text-xl font-bold">R.U.C. - {invoiceData.emisor_ruc}</p>
          <p className="text-2xl font-black bg-slate-900 text-white my-3 py-2 px-4 uppercase tracking-wider">
            {invoiceData.tipo_documento}
          </p>
          <p className="text-xl font-bold">{invoiceData.documento_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 p-6 bg-slate-50 rounded-xl border border-slate-100 mb-8">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Fecha de Emisión
          </label>
          <div className="flex items-center gap-3 text-base font-bold text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
            <Calendar size={18} className="text-blue-500" />{" "}
            {invoiceData.fecha_emision}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Tipo de Moneda
          </label>
          <div className="flex items-center gap-3 text-base font-bold text-slate-700 bg-white p-3 rounded-lg border border-slate-200 uppercase">
            <Coins size={18} className="text-blue-500" /> {invoiceData.moneda}
          </div>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Señor(es)
          </label>
          <div className="flex items-center gap-3 text-base font-bold text-slate-700 bg-white p-3 rounded-lg border border-slate-200 uppercase">
            <User size={18} className="text-blue-500" />{" "}
            {invoiceData.receptor_razon}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Documento de Identidad
          </label>
          <div className="flex items-center gap-3 text-base font-bold text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
            <Fingerprint size={18} className="text-blue-500" />{" "}
            {invoiceData.receptor_ruc}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Dirección del Cliente
          </label>
          <div className="flex items-center gap-3 text-base font-bold text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
            <MapPin size={18} className="text-blue-500 shrink-0" />{" "}
            {invoiceData.receptor_direccion}
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm mb-8">
        <table className="w-full text-left text-base border-collapse">
          <thead className="bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.15em]">
            <tr>
              <th className="px-5 py-4 text-center w-20">Item</th>
              <th className="px-5 py-4">Descripción (Editable en vivo)</th>
              <th className="px-5 py-4 text-right w-32">Cant.</th>
              <th className="px-5 py-4 text-right w-40">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoiceData.items.map((item: any, idx: number) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-5 py-8 text-center text-lg font-bold text-slate-400 align-top">
                  {idx + 1}
                </td>
                <td className="px-5 py-6">
                  <div className="relative group/input">
                    <EditableDescription
                      initialValue={item.descripcion}
                      onValueChange={(val) => handleDescriptionChange(idx, val)}
                    />
                    <div className="absolute top-4 right-4 text-slate-400 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none">
                      <Edit3 size={18} />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold border border-slate-200">
                      CÓD: {item.codigo}
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold border border-slate-200">
                      UNI: {item.unidad}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-8 text-right text-xl font-black text-slate-700 align-top">
                  {item.cantidad}
                </td>
                <td className="px-5 py-8 text-right text-xl font-black text-slate-900 align-top">
                  <span className="text-sm text-slate-400 mr-2">
                    {invoiceData.moneda}
                  </span>
                  {item.precio_total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-end space-y-4">
        <div className="flex items-center gap-10 text-slate-500 font-bold text-sm px-6 py-2">
          <span>OP. EXONERADA</span>
          <span className="text-slate-900 font-black w-32 text-right">
            {invoiceData.moneda} {invoiceData.exonerada}
          </span>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl p-8 flex items-center gap-12 shadow-xl">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Importe Total de la Venta
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-blue-400">
                {invoiceData.moneda}
              </span>
              <span className="text-5xl font-black tracking-tighter leading-none">
                {invoiceData.importe_total}
              </span>
            </div>
          </div>
          <div className="bg-white/10 p-5 rounded-xl">
            <BadgeDollarSign size={40} className="text-blue-400" />
          </div>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t border-dashed border-slate-200 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
          Representación Impresa del Documento Electrónico UBL 2.1
        </p>
      </div>
    </div>
  );
}
