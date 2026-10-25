const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const VERIFY_TIMEOUT_MS = 8000;

export function getRecaptchaSiteKey(): string | null {
  return process.env.RECAPTCHA_SITE_KEY || null;
}

function isRecaptchaEnabled(): boolean {
  return !!process.env.RECAPTCHA_SITE_KEY && !!process.env.RECAPTCHA_SECRET_KEY;
}

// Returns true when the captcha was solved, or when no keys are configured
export async function verifyRecaptcha(formData: FormData): Promise<boolean> {
  if (!isRecaptchaEnabled()) return true;

  const token = formData.get("g-recaptcha-response");
  if (typeof token !== "string" || !token) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
