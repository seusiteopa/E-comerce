import { describe, expect, it } from "vitest";
import { loyaltyTierForPaidCount } from "./rules";

describe("loyaltyTierForPaidCount", () => {
  it("premia a 2ª compra paga com 10%", () => {
    expect(loyaltyTierForPaidCount(2)).toEqual({ paidOrders: 2, discountPct: 10, validDays: 30 });
  });
  it("premia a 5ª compra paga com 15%", () => {
    expect(loyaltyTierForPaidCount(5)).toEqual({ paidOrders: 5, discountPct: 15, validDays: 30 });
  });
  it("não premia a 1ª compra", () => {
    expect(loyaltyTierForPaidCount(1)).toBeNull();
  });
  it("não premia entre os marcos", () => {
    expect(loyaltyTierForPaidCount(3)).toBeNull();
    expect(loyaltyTierForPaidCount(6)).toBeNull();
  });
});
