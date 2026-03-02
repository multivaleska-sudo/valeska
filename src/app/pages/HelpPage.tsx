import { HelpCircle, Book, MessageCircle, Mail } from "lucide-react";

export function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Ayuda</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Soporte y documentación
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <Book className="w-8 h-8 text-[#2563EB] mb-3" />
          <h2 className="text-lg font-semibold text-[#111827] mb-2">
            Documentación
          </h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Guías y manuales del sistema
          </p>
          <button className="text-sm text-[#2563EB] hover:underline">
            Ver documentación
          </button>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <MessageCircle className="w-8 h-8 text-[#16A34A] mb-3" />
          <h2 className="text-lg font-semibold text-[#111827] mb-2">
            Soporte en vivo
          </h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Chatea con nuestro equipo de soporte
          </p>
          <button className="text-sm text-[#2563EB] hover:underline">
            Iniciar chat
          </button>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <Mail className="w-8 h-8 text-[#F59E0B] mb-3" />
          <h2 className="text-lg font-semibold text-[#111827] mb-2">
            Email de soporte
          </h2>
          <p className="text-sm text-[#6B7280] mb-4">
            soporte@valeska.com
          </p>
          <button className="text-sm text-[#2563EB] hover:underline">
            Enviar email
          </button>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <HelpCircle className="w-8 h-8 text-[#0284C7] mb-3" />
          <h2 className="text-lg font-semibold text-[#111827] mb-2">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Encuentra respuestas rápidas
          </p>
          <button className="text-sm text-[#2563EB] hover:underline">
            Ver FAQ
          </button>
        </div>
      </div>
    </div>
  );
}
