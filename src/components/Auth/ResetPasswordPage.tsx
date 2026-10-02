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
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { resetPassword } from "../../api/authApi";
import { t } from "../../i18n/locale";
import { useUiStore } from "../../stores/uiStore";
import { AuthSuccessOverlay } from "./AuthSuccessOverlay";
import { Header } from "../Header/Header";

export function ResetPasswordPage() {
  const pendingResetToken = useUiStore((s) => s.pendingResetToken);
  const setPendingResetToken = useUiStore((s) => s.setPendingResetToken);
  const setView = useUiStore((s) => s.setView);

  // Consumes the handoff token once, on mount — later re-renders don't re-read the store.
  const [token, setToken] = useState(() => {
    const initial = pendingResetToken;
    if (initial) {
      setPendingResetToken("");
    }
    return initial;
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setError("");
    if (!token.trim()) {
      setError(t("authErrorTokenRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("authPasswordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("authPasswordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setSuccessOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 850));
      setView("login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reset password");
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
          data-testid="reset-password-page"
        >
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                {t("authResetPasswordTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {t("authResetPasswordSubtitle")}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" data-testid="reset-password-error">
                {error}
              </Alert>
            )}

            <TextField
              label={t("authResetToken")}
              value={token}
              onChange={(ev) => setToken(ev.target.value)}
              required
              fullWidth
              slotProps={{
                htmlInput: {
                  "data-testid": "reset-password-token",
                  style: { fontFamily: "monospace" },
                },
              }}
            />
            <TextField
              label={t("authNewPassword")}
              type="password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              autoComplete="new-password"
              required
              fullWidth
              slotProps={{ htmlInput: { "data-testid": "reset-password-new" } }}
            />
            <TextField
              label={t("authConfirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
              autoComplete="new-password"
              required
              fullWidth
              slotProps={{ htmlInput: { "data-testid": "reset-password-confirm" } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LockResetRoundedIcon />}
              disabled={loading}
              data-testid="reset-password-submit"
            >
              {t("authResetPasswordSubmit")}
            </Button>
            <Button
              type="button"
              variant="text"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => setView("login")}
              data-testid="reset-password-back-to-login"
            >
              {t("authBackToLogin")}
            </Button>
          </Stack>
        </Paper>
      </Container>
      <AuthSuccessOverlay open={successOpen} message={t("authResetPasswordSuccess")} />
    </>
  );
}
