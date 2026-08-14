"use client";

const steps = ["Identificação", "Endereço", "Frete", "Pagamento"];

export default function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progresso da compra">
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isDone = stepNumber < currentStep;
          return (
            <li key={step} className="flex items-center gap-2">
              <span
                aria-current={isActive ? "step" : undefined}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone
                    ? "bg-status-success text-white"
                    : isActive
                      ? "bg-navy text-white"
                      : "border border-line text-ink-soft"
                }`}
              >
                {isDone ? "✓" : stepNumber}
              </span>
              <span className={`hidden text-xs font-medium sm:inline ${isActive ? "text-ink" : "text-ink-soft"}`}>
                {step}
                {isActive && <span className="sr-only"> — etapa atual</span>}
              </span>
              {stepNumber < steps.length && <span className="h-px w-4 bg-line sm:w-8" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
