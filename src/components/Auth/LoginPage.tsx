import type { FormEvent } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import { fetchPreviousOrders, loginUser } from "../../api/authApi";
import { setLocale, t } from "../../i18n/locale";
import { useAuthStore } from "../../stores/authStore";
import { useLocationStore } from "../../stores/locationStore";
import { useUiStore } from "../../stores/uiStore";
import { AuthSuccessOverlay } from "./AuthSuccessOverlay";
import { Header } from "../Header/Header";

export function LoginPage() {
  const [email, setEmail] = useState("alex@beetees.test");
  const [password, setPassword] = useState("beetee123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setOrders = useAuthStore((s) => s.setOrders);
  const setDeliveryFromServer = useLocationStore((s) => s.setDeliveryFromServer);
  const setView = useUiStore((s) => s.setView);
  const bumpLocaleVersion = useUiStore((s) => s.bumpLocaleVersion);

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await loginUser(email.trim(), password);
      setUser(user);
      if (user.location) {
        setLocale(user.location.countryCode);
        setDeliveryFromServer(user.location);
        bumpLocaleVersion();
      }
      const orders = await fetchPreviousOrders();
      setOrders(orders);
      setSuccessOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 850));
      setView("shop");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header brandOnly />
      <Container component="main" maxWidth="xs" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper
          component="form"
          noValidate
          onSubmit={handleSubmit}
          elevation={4}
          sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}
        >
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                {t("authLoginTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {t("authLoginSubtitle")}
              </Typography>
            </Box>
            {error && (
              <Alert severity="error" data-testid="login-error">
                {error}
              </Alert>
            )}
            <TextField
              label={t("authEmail")}
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              autoComplete="email"
              required
              fullWidth
              slotProps={{ htmlInput: { "data-testid": "login-email" } }}
            />
            <TextField
              label={t("authPassword")}
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              slotProps={{ htmlInput: { "data-testid": "login-password" } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LoginRoundedIcon />}
              disabled={loading}
              data-testid="login-submit"
            >
              {t("authLogin")}
            </Button>
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setView("forgot-password")}
              data-testid="login-forgot-password"
            >
              {t("authForgotPasswordLink")}
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={() => setView("signup")}
            >
              {t("authNeedAccount")} {t("authSignup")}
            </Button>
            <Button
              type="button"
              variant="text"
              startIcon={<PersonOffRoundedIcon />}
              onClick={() => setView("shop")}
            >
              {t("authContinueGuest")}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {t("authDemoHint")}
            </Typography>
          </Stack>
        </Paper>
      </Container>
      <AuthSuccessOverlay open={successOpen} message={t("authLoginSuccess")} />
    </>
  );
}
