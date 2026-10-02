import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import { useCheckoutStore } from "../../stores/checkoutStore";
import { t } from "../../i18n/locale";

type Props = {
  subtotalUsd: number;
};

export function PromoCodeSection({ subtotalUsd }: Props) {
  const promoCodeInput = useCheckoutStore((s) => s.promoCodeInput);
  const appliedPromo = useCheckoutStore((s) => s.appliedPromo);
  const promoError = useCheckoutStore((s) => s.promoError);
  const setPromoCodeInput = useCheckoutStore((s) => s.setPromoCodeInput);
  const applyPromoCode = useCheckoutStore((s) => s.applyPromoCode);
  const removePromoCode = useCheckoutStore((s) => s.removePromoCode);

  return (
    <Box data-testid="checkout-promo">
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
        <LocalOfferRoundedIcon fontSize="small" color="primary" />
        <Typography variant="body2">{t("checkoutPromoLabel")}</Typography>
      </Stack>

      {appliedPromo ? (
        <Stack
          direction="row"
          spacing={1}
          data-testid="checkout-promo-applied"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t("checkoutPromoApplied", { code: appliedPromo.code })}
          </Typography>
          <Button
            size="small"
            color="inherit"
            onClick={removePromoCode}
            data-action="remove-promo"
            data-testid="checkout-promo-remove"
          >
            {t("checkoutPromoRemove")}
          </Button>
        </Stack>
      ) : (
        <>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder={t("checkoutPromoPlaceholder")}
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyPromoCode(subtotalUsd);
                }
              }}
              aria-label={t("checkoutPromoLabel")}
              fullWidth
              slotProps={{
                htmlInput: { "data-testid": "checkout-promo-input" },
              }}
            />
            <Button
              variant="outlined"
              onClick={() => applyPromoCode(subtotalUsd)}
              disabled={promoCodeInput.trim() === ""}
              data-action="apply-promo"
              data-testid="checkout-promo-apply"
            >
              {t("checkoutPromoApply")}
            </Button>
          </Stack>
          {promoError && (
            <Alert
              severity="error"
              variant="outlined"
              role="alert"
              sx={{ mt: 1 }}
              data-testid="checkout-promo-error"
            >
              {promoError}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
