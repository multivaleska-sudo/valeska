import { Calendar, Receipt } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";

interface DeliveryCardProps {
  delivered: boolean;
  onToggleDelivery: (delivered: boolean) => void;
  onGenerateReceipt: () => void;
}

export function DeliveryCard({ delivered, onToggleDelivery, onGenerateReceipt }: DeliveryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
      <h2 className="text-lg font-semibold text-[#111827] mb-4">
        Entrega de Tarjeta
      </h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch.Root
            checked={delivered}
            onCheckedChange={onToggleDelivery}
            className="w-11 h-6 bg-[#E5E7EB] rounded-full relative data-[state=checked]:bg-[#2563EB] transition-colors"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
          <div>
            <label className="text-sm font-medium text-[#111827]">
              Se entregó tarjeta de propiedad
            </label>
            {delivered && (
              <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Entregado: {new Date().toLocaleDateString("es-PE")}
              </p>
            )}
          </div>
        </div>
        {delivered && (
          <button
            onClick={onGenerateReceipt}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 text-sm"
          >
            <Receipt className="w-4 h-4" />
            Generar recibo
          </button>
        )}
      </div>
    </div>
  );
}
