import { createContext, useContext, useState, ReactNode } from "react";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  Box,
  Stack,
} from "@mui/material";

type AlertType = "success" | "error" | "warning" | "info";

type ConfirmOptions = {
  title?: string;
  message: string;
  onConfirm: () => void;
};

type CtxType = {
  showAlert: (msg: string, type?: AlertType) => void;
  confirm: (opts: ConfirmOptions) => void;
};

const NotificationContext = createContext<CtxType | null>(null);

function SlideUp(props: any) {
  return <Slide {...props} direction="up" timeout={360} />;
}

/* ===== Soft premium alert palette ===== */
const soft = {
  success: { bg: "#ecfdf5", border: "#327bcd", text: "#063e5f" },
  error: { bg: "#fef2f2", border: "#f87171", text: "#7d1616" },
  warning: { bg: "#fffbeb", border: "#fbbf24", text: "#78350f" },
  info: { bg: "#eff6ff", border: "#60a5fa", text: "#1e3a8a" },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  /* ================= ALERT ================= */
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "success" as AlertType,
  });

  const showAlert = (message: string, type: AlertType = "success") => {
    setAlert({ open: true, message, type });
  };

  /* ================= CONFIRM ================= */
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const confirm = (opts: ConfirmOptions) => setConfirmState(opts);
  const closeConfirm = () => setConfirmState(null);

  const c = soft[alert.type];

  return (
    <NotificationContext.Provider value={{ showAlert, confirm }}>
      {children}

      {/* ================= PREMIUM ALERT ================= */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3400}
        onClose={() => setAlert((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={SlideUp}
        sx={{
          mt: 2,
          ml: 2,
        }}
      >
        <Alert
          icon={false}
          sx={{
            minWidth: 420,
            maxWidth: 640,
            borderRadius: 3.5,
            px: 2.6,
            py: 1.8,

            /* soft premium surface */
            background: `linear-gradient(180deg, ${c.bg}, #f6f2f2)`,
            color: c.text,
            border: `1px solid ${c.border}`,

            /* glass + depth */
            backdropFilter: "blur(10px)",
            boxShadow: "0 26px 80px rgba(0,0,0,0.25)",

            /* animation */
            animation: "alertIn .35s ease",
            "@keyframes alertIn": {
              from: { opacity: 0, transform: "translateY(-10px) scale(.97)" },
              to: { opacity: 1, transform: "translateY(0) scale(1)" },
            },
          }}
        >
          <Stack spacing={0.4}>
            <Box sx={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>
              {alert.type.toUpperCase()}
            </Box>
            <Box sx={{ fontSize: 15, fontWeight: 700 }}>{alert.message}</Box>
          </Stack>
        </Alert>
      </Snackbar>

      {/* ================= PREMIUM CONFIRM DIALOG ================= */}
      <Dialog
        open={!!confirmState}
        onClose={closeConfirm}
        maxWidth="xs"
        fullWidth
        TransitionComponent={SlideUp}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 36px 100px rgba(0,0,0,0.45)",
            animation: "dialogIn .28s ease",
            "@keyframes dialogIn": {
              from: { opacity: 0, transform: "scale(.96)" },
              to: { opacity: 1, transform: "scale(1)" },
            },
          },
        }}
      >
        {/* ===== Premium branded header ===== */}
        <Box
          sx={{
            px: 3,
            py: 2.2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.4,
          }}
        >
          {confirmState?.title ?? "Confirm Action"}
        </Box>

        <DialogContent
          sx={{
            px: 3,
            py: 3,
            fontSize: 14.5,
            lineHeight: 1.55,
            opacity: 0.92,
          }}
        >
          {confirmState?.message}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={closeConfirm}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              px: 2.4,
              fontWeight: 700,
              transition: "all .18s",
              "&:hover": {
                transform: "translateY(-1px)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmState?.onConfirm();
              closeConfirm();
            }}
            sx={{
              borderRadius: 2.5,
              px: 2.8,
              fontWeight: 800,
              boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
              transition: "all .18s",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be inside provider");
  return ctx;
}
