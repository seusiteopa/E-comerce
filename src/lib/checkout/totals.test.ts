import { describe, expect, it } from "vitest";
import { calculateOrderTotal, couponStillApplies, roundCents } from "./totals";

describe("calculateOrderTotal", () => {
  it("soma produtos e frete e subtrai o desconto", () => {
    expect(calculateOrderTotal({ subtotal: 100, shipping: 20, discount: 10 })).toBe(110);
  });

  it("produto digital sem frete: total é só o produto", () => {
    expect(calculateOrderTotal({ subtotal: 0.01, shipping: 0, discount: 0 })).toBe(0.01);
  });

  it("não deixa o total negativo quando o desconto é maior que o pedido", () => {
    expect(calculateOrderTotal({ subtotal: 50, shipping: 0, discount: 80 })).toBe(0);
  });

  it("ignora desconto negativo", () => {
    expect(calculateOrderTotal({ subtotal: 50, shipping: 10, discount: -5 })).toBe(60);
  });

  it("mantém centavos exatos mesmo com valores que geram dízima", () => {
    expect(calculateOrderTotal({ subtotal: 0.1, shipping: 0.2, discount: 0 })).toBe(0.3);
  });
});

describe("roundCents", () => {
  it("arredonda para duas casas", () => {
    expect(roundCents(1.005 + 0.001)).toBe(1.01);
    expect(roundCents(2.999)).toBe(3);
  });
});

describe("couponStillApplies", () => {
  it("vale quando o subtotal é o mesmo em que foi aplicado", () => {
    expect(couponStillApplies(30, 30)).toBe(true);
  });

  it("deixa de valer quando os produtos mudam", () => {
    expect(couponStillApplies(30, 45)).toBe(false);
  });

  it("não vale quando nunca foi aplicado", () => {
    expect(couponStillApplies(null, 30)).toBe(false);
  });
});
