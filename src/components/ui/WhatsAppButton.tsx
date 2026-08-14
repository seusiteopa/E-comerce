import { MessageCircle } from "lucide-react";
import { whatsappHref } from "@/data/site";

export default function WhatsAppButton({ message, label = "Falar no WhatsApp" }: { message?: string; label?: string }) {
  return (
    <a
      href={whatsappHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-status-success text-status-success px-6 py-3 text-sm font-semibold transition-colors hover:bg-status-success-bg"
    >
      <MessageCircle size={16} aria-hidden="true" />
      {label}
    </a>
  );
}
