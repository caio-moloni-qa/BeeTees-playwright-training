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
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { requestPasswordReset } from "../../api/authApi";
import { t } from "../../i18n/locale";
import { useUiStore } from "../../stores/uiStore";
import { Header } from "../Header/Header";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const setView = useUiStore((s) => s.setView);
  const setPendingResetToken = useUiStore((s) => s.setPendingResetToken);

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
      setDevResetToken(result.devResetToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  const continueToReset = () => {
    if (devResetToken) {
      setPendingResetToken(devResetToken);
    }
    setView("reset-password");
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
          data-testid="forgot-password-page"
        >
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                {t("authForgotPasswordTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {t("authForgotPasswordSubtitle")}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" data-testid="forgot-password-error">
                {error}
              </Alert>
            )}

            {message ? (
              <>
                <Alert severity="success" data-testid="forgot-password-success">
                  {message}
                </Alert>
                {devResetToken && (
                  <Alert
                    severity="info"
                    variant="outlined"
                    data-testid="forgot-password-dev-token"
                  >
                    <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                      {t("authForgotPasswordDevHint")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                    >
                      {devResetToken}
                    </Typography>
                  </Alert>
                )}
                {devResetToken && (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={continueToReset}
                    data-testid="forgot-password-dev-continue"
                  >
                    {t("authForgotPasswordDevContinue")}
                  </Button>
                )}
              </>
            ) : (
              <TextField
                label={t("authEmail")}
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                autoComplete="email"
                required
                fullWidth
                slotProps={{ htmlInput: { "data-testid": "forgot-password-email" } }}
              />
            )}

            {!message && (
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<MailRoundedIcon />}
                disabled={loading}
                data-testid="forgot-password-submit"
              >
                {t("authForgotPasswordSubmit")}
              </Button>
            )}

            <Button
              type="button"
              variant="text"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => setView("login")}
              data-testid="forgot-password-back-to-login"
            >
              {t("authBackToLogin")}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </>
  );
}
