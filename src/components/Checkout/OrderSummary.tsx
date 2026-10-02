import { useMemo } from "react";
import {
  Box,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  getCartLines,
  selectSubtotal,
  useCartStore,
} from "../../stores/cartStore";
import {
  type TipPercent,
  useCheckoutStore,
} from "../../stores/checkoutStore";
import { getProductById } from "../../data/products";
import { formatPrice, productShortName, t } from "../../i18n/locale";
import { DonationSection } from "./DonationSection";
import { PromoCodeSection } from "./PromoCodeSection";

const TIP_OPTIONS: TipPercent[] = [0, 10, 15, 20];

export function OrderSummary() {
  const linesById = useCartStore((s) => s.linesById);
  const lines = useMemo(() => getCartLines(linesById), [linesById]);
  const subtotal = useCartStore(selectSubtotal);
  const f = useCheckoutStore((s) => s.form);
  const setField = useCheckoutStore((s) => s.setField);
  const appliedPromo = useCheckoutStore((s) => s.appliedPromo);

  const tipAmount = (subtotal * f.tipPercent) / 100;
  const donationAmount =
    f.donationType === "fixed"
      ? f.donationAmount
      : f.donationType === "percent"
        ? (subtotal * f.donationAmount) / 100
        : 0;
  const discountAmount = appliedPromo?.discountUsd ?? 0;
  // A fixed-amount code can never push the total below zero.
  const grandTotal = Math.max(0, subtotal + tipAmount + donationAmount - discountAmount);

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }} aria-labelledby="checkout-summary-title">
      <Typography
        id="checkout-summary-title"
        variant="subtitle1"
        sx={{ mb: 2, fontWeight: 700 }}
      >
        {t("checkoutOrderSummary")}
      </Typography>

      <Box data-testid="checkout-summary-lines" sx={{ mb: 2 }}>
        {lines.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("checkoutNoItems")}
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {lines.map((line) => {
              const product = getProductById(line.productId);
              if (!product) {
                return null;
              }
              return (
                <Box key={line.id}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">
                      {productShortName(product)} x {line.quantity}
                    </Typography>
                    <Typography variant="body2">
                      {formatPrice(line.unitPriceUsd * line.quantity)}
                    </Typography>
                  </Stack>
                  {line.customizationSummary.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", maxWidth: "38rem" }}
                    >
                      {line.customizationSummary.join(", ")}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <PromoCodeSection subtotalUsd={subtotal} />
      </Box>

      <Box data-testid="checkout-tip-selector" sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          {t("checkoutTip")}
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={f.tipPercent}
          exclusive
          onChange={(_, value) => {
            if (value !== null) {
              setField("tipPercent", value as TipPercent);
            }
          }}
          aria-label={t("checkoutTip")}
        >
          {TIP_OPTIONS.map((pct) => (
            <ToggleButton
              key={pct}
              value={pct}
              data-action="set-tip"
              data-tip-percent={pct}
              data-testid={`tip-option-${pct}`}
            >
              {pct === 0 ? t("checkoutTipNone") : `${pct}%`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <DonationSection />

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">{t("checkoutSubtotal")}</Typography>
          <Typography variant="body2" data-testid="checkout-subtotal">
            {formatPrice(subtotal)}
          </Typography>
        </Stack>
        {appliedPromo && (
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between" }}
            data-testid="checkout-discount-amount"
          >
            <Typography variant="body2">
              {t("checkoutDiscount")} ({appliedPromo.label})
            </Typography>
            <Typography variant="body2" color="success.main">
              -{formatPrice(discountAmount)}
            </Typography>
          </Stack>
        )}
        {f.tipPercent > 0 && (
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between" }}
            data-testid="checkout-tip-amount"
          >
            <Typography variant="body2">
              {t("checkoutTip")} ({f.tipPercent}%)
            </Typography>
            <Typography variant="body2">{formatPrice(tipAmount)}</Typography>
          </Stack>
        )}
        {f.donationType !== "none" && (
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between" }}
            data-testid="checkout-donation-amount"
          >
            <Typography variant="body2">{t("checkoutDonationAssociation")}</Typography>
            <Typography variant="body2">{formatPrice(donationAmount)}</Typography>
          </Stack>
        )}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            pt: 1,
          }}
          data-testid="checkout-total"
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t("checkoutTotal")}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }} component="strong">
            {formatPrice(grandTotal)}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
