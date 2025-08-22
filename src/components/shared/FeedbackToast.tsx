import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface FeedbackToastProps {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    variant: "default" as const,
    className: "border-green-200 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100"
  },
  error: {
    icon: AlertCircle,
    variant: "destructive" as const,
    className: "border-red-200 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
  },
  warning: {
    icon: AlertTriangle,
    variant: "default" as const,
    className: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100"
  },
  info: {
    icon: Info,
    variant: "default" as const,
    className: "border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
  }
};

export const showFeedbackToast = ({ 
  type, 
  title, 
  description, 
  duration = 5000 
}: FeedbackToastProps) => {
  const config = toastConfig[type];
  const Icon = config.icon;

  return toast({
    variant: config.variant,
    duration,
    className: config.className,
    title: `${title}`,
    description: description ? `${description}` : undefined,
  });
};

// Convenience functions for common use cases
export const showSuccessToast = (title: string, description?: string) => 
  showFeedbackToast({ type: "success", title, description });

export const showErrorToast = (title: string, description?: string) => 
  showFeedbackToast({ type: "error", title, description });

export const showWarningToast = (title: string, description?: string) => 
  showFeedbackToast({ type: "warning", title, description });

export const showInfoToast = (title: string, description?: string) => 
  showFeedbackToast({ type: "info", title, description });