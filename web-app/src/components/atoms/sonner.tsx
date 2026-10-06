"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        close: <XIcon aria-hidden="true" className="size-3.5" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#cbd5e1",
          "--normal-bg-hover": "#f8fafc",
          "--normal-border-hover": "#94a3b8",
          "--success-bg": "#dcfce7",
          "--success-border": "#86efac",
          "--success-text": "#14532d",
          "--info-bg": "#dbeafe",
          "--info-border": "#93c5fd",
          "--info-text": "#1e3a8a",
          "--warning-bg": "#fef3c7",
          "--warning-border": "#fcd34d",
          "--warning-text": "#78350f",
          "--error-bg": "#fee2e2",
          "--error-border": "#fca5a5",
          "--error-text": "#7f1d1d",
          "--width": "min(480px, calc(100vw - 2rem))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: "Fechar notificação",
        style: {
          width: "min(480px, calc(100vw - 2rem))",
          border: "none",
        },
        classNames: {
          toast: "cn-toast",
          closeButton: "cursor-pointer",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
