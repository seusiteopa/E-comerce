"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function CouponField() {
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3"
    >
      <label htmlFor="coupon" className="sr-only">
        Código do cupom
      </label>
      <input
        id="coupon"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código do cupom"
        className="flex-1 bg-transparent px-2 text-sm outline-none"
      />
      <Button type="submit" variant="secondary" className="px-4 py-2 text-xs">
        Aplicar
      </Button>
    </form>
  );
}
