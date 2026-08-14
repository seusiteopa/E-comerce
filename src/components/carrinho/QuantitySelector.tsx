"use client";

export default function QuantitySelector({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-line">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        aria-label="Diminuir quantidade"
        className="flex h-8 w-8 items-center justify-center text-ink hover:bg-paper"
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label="Aumentar quantidade"
        className="flex h-8 w-8 items-center justify-center text-ink hover:bg-paper"
      >
        +
      </button>
    </div>
  );
}
