import toast from "react-hot-toast";

type NotificationType = "success" | "info" | "warning" | "error" | "loading";

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  success: "check-circle",
  info: "information-circle",
  warning: "exclamation-triangle",
  error: "x-circle",
  loading: "spinner",
};

export const notification = {
  success: (message: string, options?: { icon?: string; duration?: number }) => {
    return toast.success(message, {
      icon: options?.icon,
      duration: options?.duration ?? 3000,
    });
  },

  info: (message: string, options?: { icon?: string; duration?: number }) => {
    return toast(message, {
      icon: options?.icon ?? "i",
      duration: options?.duration ?? 3000,
    });
  },

  warning: (message: string, options?: { icon?: string; duration?: number }) => {
    return toast(message, {
      icon: options?.icon ?? "!",
      duration: options?.duration ?? 3000,
      style: {
        background: "#fef3c7",
        color: "#92400e",
      },
    });
  },

  error: (message: string, options?: { icon?: string; duration?: number }) => {
    return toast.error(message, {
      icon: options?.icon,
      duration: options?.duration ?? 3000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    toast.remove(toastId);
  },
};
