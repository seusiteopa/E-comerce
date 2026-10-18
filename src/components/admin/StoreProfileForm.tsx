"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { updateStoreProfileAction } from "@/actions/admin/loja";
import { uploadFileToCloudinary } from "@/lib/cloudinary-client";

interface StoreProfile {
  name: string;
  footer_text: string;
  contact_email: string;
  instagram_url: string;
  description: string;
  whatsapp: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  logo_url: string;
  printer_app: "thermer" | "rawbt";
}

const inputClass = "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-navy";

export default function StoreProfileForm({ store, folder }: { store: StoreProfile; folder: string }) {
  const [values, setValues] = useState(store);
  const [message, setMessage] = useState<{ type: "ok" | "erro"; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof StoreProfile>(key: K, value: StoreProfile[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleImage(field: "og_image_url" | "logo_url", file: File | undefined) {
    if (!file) return;
    setUploading(field);
    setMessage(null);
    try {
      const url = await uploadFileToCloudinary(file, "image", `${folder}/${field === "og_image_url" ? "og" : "logo"}`);
      set(field, url);
    } catch (err) {
      setMessage({ type: "erro", text: `Não foi possível enviar a imagem: ${(err as Error).message}` });
    } finally {
      setUploading(null);
    }
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStoreProfileAction(values);
      setMessage(result.success ? { type: "ok", text: "Dados da loja salvos." } : { type: "erro", text: result.error });
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink">Nome da loja</label>
        <input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink">Descrição curta</label>
        <textarea id="description" rows={2} value={values.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="whatsapp" className="text-sm font-medium text-ink">WhatsApp da loja (com DDD)</label>
        <input id="whatsapp" value={values.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className={inputClass} placeholder="5519999999999" />
      </div>
        <div>
          <label htmlFor="footer_text" className="text-sm font-medium text-ink">Texto de apresentação (rodapé)</label>
          <textarea id="footer_text" rows={2} value={values.footer_text} onChange={(e) => set("footer_text", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact_email" className="text-sm font-medium text-ink">E-mail de contato</label>
          <input id="contact_email" type="email" value={values.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="instagram_url" className="text-sm font-medium text-ink">Instagram (link)</label>
          <input id="instagram_url" value={values.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} className={inputClass} placeholder="https://instagram.com/sua-loja" />
        </div>

      <div>
        <p className="text-sm font-medium text-ink">Logo</p>
        {values.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.logo_url} alt="Logo atual" className="mt-2 h-16 w-auto rounded-lg border border-line" />
        )}
        <input type="file" accept="image/*" onChange={(e) => handleImage("logo_url", e.target.files?.[0])} className="mt-2 w-full text-sm" />
        {uploading === "logo_url" && <p className="mt-1 text-xs text-ink-soft">Enviando...</p>}
      </div>

      <div className="border-t border-line pt-5">
        <p className="text-sm font-semibold text-ink">Prévia do link (quando compartilham no WhatsApp, Instagram etc.)</p>
        <div className="mt-3">
          <label htmlFor="og_title" className="text-sm font-medium text-ink">Título</label>
          <input id="og_title" value={values.og_title} onChange={(e) => set("og_title", e.target.value)} className={inputClass} />
        </div>
        <div className="mt-3">
          <label htmlFor="og_description" className="text-sm font-medium text-ink">Descrição</label>
          <textarea id="og_description" rows={2} value={values.og_description} onChange={(e) => set("og_description", e.target.value)} className={inputClass} />
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium text-ink">Imagem (ideal: 1200 × 630)</p>
          {values.og_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.og_image_url} alt="Imagem de compartilhamento atual" className="mt-2 w-full max-w-sm rounded-lg border border-line" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleImage("og_image_url", e.target.files?.[0])} className="mt-2 w-full text-sm" />
          {uploading === "og_image_url" && <p className="mt-1 text-xs text-ink-soft">Enviando...</p>}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <label htmlFor="printer_app" className="text-sm font-semibold text-ink">App de impressão térmica</label>
        <select id="printer_app" value={values.printer_app} onChange={(e) => set("printer_app", e.target.value as "thermer" | "rawbt")} className={inputClass}>
          <option value="thermer">Thermer</option>
          <option value="rawbt">RawBT</option>
        </select>
        <p className="mt-1 text-xs text-ink-soft">
          Instale o app escolhido no celular, pareie a impressora Bluetooth nele e use o botão &quot;Imprimir&quot; nos pedidos. O app é quem conversa com a impressora, qualquer marca.
        </p>
      </div>

      {message && (
        <p role={message.type === "erro" ? "alert" : "status"} className={`text-sm ${message.type === "erro" ? "text-status-danger" : "text-ink"}`}>
          {message.text}
        </p>
      )}
      <Button type="button" onClick={handleSave} disabled={isPending || uploading !== null}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
