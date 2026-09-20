import { Button } from "@mui/material";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { useUiStore } from "../../stores/uiStore";
import { t } from "../../i18n/locale";

export function HungerButton() {
  const setView = useUiStore((s) => s.setView);

  return (
    <Button
      variant="outlined"
      color="secondary"
      startIcon={<RestaurantRoundedIcon />}
      onClick={() => setView("hunger")}
      data-testid="hunger-button"
      sx={{
        borderRadius: 999,
        px: 2,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {t("hungerButton")}
    </Button>
  );
}
