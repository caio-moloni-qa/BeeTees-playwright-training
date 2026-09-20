import { useCallback } from "react";
import { Backdrop, CircularProgress, Stack, Typography } from "@mui/material";
import { useCartStore } from "./stores/cartStore";
import { useLocationStore } from "./stores/locationStore";
import { useUiStore } from "./stores/uiStore";
import { useContentBootstrap } from "./hooks/useContentBootstrap";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useEscapeKey } from "./hooks/useEscapeKey";
import { useInitialDelivery } from "./hooks/useInitialDelivery";
import { CartDrawer } from "./components/Cart/CartDrawer";
import { CheckoutPage } from "./components/Checkout/CheckoutPage";
import { ConfirmationPage } from "./components/Confirmation/ConfirmationPage";
import { HungerMeterPage } from "./components/Hunger/HungerMeterPage";
import { LocationDrawer } from "./components/Location/LocationDrawer";
import { ItemCustomizerDialog } from "./components/Menu/ItemCustomizerDialog";
import { MenuPage } from "./components/Menu/MenuPage";
import { LoginPage } from "./components/Auth/LoginPage";
import { SignupPage } from "./components/Auth/SignupPage";
import { ProfilePage } from "./components/Profile/ProfilePage";
import { PageSpinner } from "./components/feedback/PageSpinner";
import { Toast } from "./components/feedback/Toast";

export function App() {
  const content = useContentBootstrap();
  const view = useUiStore((s) => s.view);
  useUiStore((s) => s.localeVersion);

  const cartOpen = useCartStore((s) => s.drawerOpen);
  const closeCart = useCartStore((s) => s.closeDrawer);
  const panelOpen = useLocationStore((s) => s.panelOpen);
  const closePanel = useLocationStore((s) => s.closePanel);
  const setPendingAddProductId = useUiStore((s) => s.setPendingAddProductId);

  useInitialDelivery();
  useAuthBootstrap();

  // Body scroll-lock is handled automatically by MUI's Drawer (and Modal portal),
  // so the legacy `body.cart-open` class is no longer needed.

  const handleEscape = useCallback(() => {
    if (panelOpen) {
      setPendingAddProductId(null);
      closePanel();
      return;
    }
    if (cartOpen) {
      closeCart();
    }
  }, [panelOpen, cartOpen, closePanel, closeCart, setPendingAddProductId]);

  useEscapeKey(handleEscape);

  if (content.error) {
    return (
      <Backdrop
        open
        aria-label="Content database unavailable"
        sx={{
          color: "primary.contrastText",
          zIndex: (theme) => theme.zIndex.modal + 10,
          backgroundColor: "rgba(8, 5, 3, 0.86)",
          backdropFilter: "blur(2px)",
          px: 3,
          textAlign: "center",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6">Content database unavailable</Typography>
          <Typography variant="body2" color="text.secondary">
            Run docker compose up -d db and npm run db:setup.
          </Typography>
        </Stack>
      </Backdrop>
    );
  }

  if (!content.ready) {
    return (
      <Backdrop
        open
        aria-label="Loading content"
        sx={{
          color: "primary.contrastText",
          zIndex: (theme) => theme.zIndex.modal + 10,
          backgroundColor: "rgba(8, 5, 3, 0.74)",
          backdropFilter: "blur(2px)",
        }}
      >
        <CircularProgress color="secondary" thickness={4.5} size={56} />
      </Backdrop>
    );
  }

  return (
    <>
      {view === "checkout" && <CheckoutPage />}
      {view === "confirmation" && <ConfirmationPage />}
      {view === "login" && <LoginPage />}
      {view === "signup" && <SignupPage />}
      {view === "profile" && <ProfilePage />}
      {view === "hunger" && <HungerMeterPage />}
      {view === "shop" && <MenuPage />}
      {view !== "confirmation" && (
        <>
          <CartDrawer />
          <LocationDrawer />
          <ItemCustomizerDialog />
        </>
      )}
      <Toast />
      <PageSpinner />
    </>
  );
}
