import { useEffect, useRef } from "react";

interface Grecaptcha {
  render: (container: HTMLElement, options: { sitekey: string }) => number;
  reset: (widgetId: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    onRecaptchaLoad?: () => void;
  }
}

interface RecaptchaProps {
  siteKey: string | null;
  resetKey?: unknown;
}

let scriptPromise: Promise<void> | null = null;

// Explicit rendering, because React Router switches pages without a full reload
function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      window.onRecaptchaLoad = () => resolve();
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        scriptPromise = null;
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function Recaptcha({ siteKey, resetKey }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadRecaptchaScript().then(() => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha!.render(containerRef.current, { sitekey: siteKey });
    });
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  // Tokens are single-use, so clear the checkbox after each failed submit
  useEffect(() => {
    if (resetKey && widgetIdRef.current !== null) {
      window.grecaptcha?.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
