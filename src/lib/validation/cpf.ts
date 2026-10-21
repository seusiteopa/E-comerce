/** Valida um CPF pelos dígitos verificadores (aceita com ou sem pontuação). */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(digits[i]) * (t + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(digits[t])) return false;
  }
  return true;
}
