import { useMemo, useState } from "react";
import { Box, Button, Container, Slider, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { products } from "../../data/products";
import {
  HUNGER_LEVEL_COUNT,
  HUNGER_LEVEL_LABELS,
  pickForHungerLevel,
} from "../../data/hunger";
import { t } from "../../i18n/locale";
import { useUiStore } from "../../stores/uiStore";
import { Header } from "../Header/Header";
import { ProductCard } from "../Menu/ProductCard";

const METER_GRADIENT =
  "linear-gradient(90deg, #5fbf7a 0%, #f6c453 38%, #e0793f 68%, #c0392b 100%)";

export function HungerMeterPage() {
  const setView = useUiStore((s) => s.setView);
  const [level, setLevel] = useState(0);

  const picks = useMemo(() => pickForHungerLevel(products, level), [level]);
  const levelLabel = t(HUNGER_LEVEL_LABELS[level]);

  const marks = HUNGER_LEVEL_LABELS.map((key, index) => ({
    value: index,
    label: t(key),
  }));

  return (
    <>
      <Header />
      <Container
        component="main"
        maxWidth="lg"
        data-testid="hunger-page"
        sx={{ py: { xs: 3, md: 4 } }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => setView("shop")}
          data-testid="hunger-back-to-menu"
          sx={{ mb: 2 }}
        >
          {t("hungerBackToMenu")}
        </Button>

        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
          {t("hungerPageTitle")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t("hungerPageSubtitle")}
        </Typography>

        <Box sx={{ maxWidth: 640, mx: "auto", mb: 5, px: { xs: 1, sm: 2 } }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 1.5 }}
          >
            <Typography variant="overline" color="text.secondary">
              {t("hungerPageTitle")}
            </Typography>
            <Typography
              variant="h6"
              component="span"
              data-testid="hunger-level-label"
              sx={{ fontWeight: 700 }}
            >
              {levelLabel}
            </Typography>
          </Stack>
          <Slider
            value={level}
            onChange={(_, value) => setLevel(value as number)}
            min={0}
            max={HUNGER_LEVEL_COUNT - 1}
            step={1}
            marks={marks}
            valueLabelDisplay="off"
            aria-label={t("hungerPageTitle")}
            data-testid="hunger-meter-slider"
            slotProps={{
              input: {
                "aria-valuetext": levelLabel,
              },
            }}
            sx={{
              height: 10,
              color: "transparent",
              "& .MuiSlider-rail": {
                background: METER_GRADIENT,
                opacity: 1,
              },
              "& .MuiSlider-track": {
                background: "transparent",
                border: "none",
              },
              "& .MuiSlider-thumb": {
                width: 24,
                height: 24,
                bgcolor: "background.paper",
                border: "3px solid",
                borderColor: "secondary.main",
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: "0 0 0 8px rgba(246, 196, 83, 0.16)",
                },
              },
              "& .MuiSlider-mark": {
                width: 2,
                height: 10,
                bgcolor: "rgba(0,0,0,0.35)",
              },
              "& .MuiSlider-markLabel": {
                fontSize: "0.72rem",
                color: "text.secondary",
                whiteSpace: "nowrap",
              },
            }}
          />
        </Box>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, mb: 2 }}
          data-testid="hunger-results-heading"
        >
          {t("hungerResultsHeading")}
        </Typography>
        <Box
          data-testid="hunger-results-grid"
          sx={{
            display: "grid",
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {picks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Box>
      </Container>
    </>
  );
}
