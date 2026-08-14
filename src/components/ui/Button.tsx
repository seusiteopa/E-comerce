import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<Variant, string> = {
  primary: "bg-farol text-ink hover:bg-farol-deep shadow-sm",
  secondary: "border border-navy text-navy hover:bg-navy hover:text-white",
  ghost: "text-navy hover:bg-navy/5",
  danger: "text-status-danger hover:bg-status-danger-bg",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function LinkButton({ href, variant = "primary", children, className = "", ...rest }: LinkButtonProps) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const styles = `${base} ${variantStyles[variant]} ${className}`;

  if (isExternal) {
    return (
      <a href={href} className={styles} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

/** Botão de ação real (não navegação) — usado em interações client-side como adicionar ao carrinho. */
export default function Button({ variant = "primary", children, className = "", ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variantStyles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
