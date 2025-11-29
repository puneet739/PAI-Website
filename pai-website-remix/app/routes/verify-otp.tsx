import type { Route } from "./+types/verify-otp";
import { Form, redirect, useActionData } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const { getSession } = await import("~/lib/session.server");
  const session = await getSession(request.headers.get("Cookie"));
  const email = session.get("registrationEmail");

  if (!email) {
    return redirect("/register");
  }

  return { email };
}

export async function action({ request }: Route.ActionArgs) {
  const { getSession } = await import("~/lib/session.server");
  const { createMember } = await import("~/lib/auth.server");
  const { createUserSession } = await import("~/lib/session.server");
  
  const session = await getSession(request.headers.get("Cookie"));
  const email = session.get("registrationEmail");

  if (!email) {
    return redirect("/register");
  }

  const formData = await request.formData();
  const otp = formData.get("otp");
  const name = formData.get("name");

  if (typeof otp !== "string" || !otp) {
    return {
      error: "OTP is required",
    };
  }

  if (typeof name !== "string" || !name) {
    return {
      error: "Name is required",
    };
  }

  // Validate OTP is 6 digits
  if (!/^\d{6}$/.test(otp)) {
    return {
      error: "OTP must be 6 digits",
    };
  }

  // Demo: Accept any 6-digit OTP
  // In production, you would verify against the sent OTP

  try {
    // Create new member with inactive status
    const member = await createMember(email, otp, name); // Using OTP as temporary password
    
    // Clear registration session
    session.unset("registrationEmail");
    
    // Create user session and redirect to dashboard
    return createUserSession(member.id, "/dashboard");
  } catch (error) {
    return {
      error: "Failed to create account. Please try again.",
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify OTP - PAI" },
    { name: "description", content: "Verify your email address" },
  ];
}

export default function VerifyOTP({ loaderData }: Route.ComponentProps) {
  const { email } = loaderData;
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification code to
          </p>
          <p className="text-center text-sm font-medium text-gray-900 dark:text-white">
            {email}
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-800 sm:text-sm"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-800 text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
            />
          </div>

          {actionData?.error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Demo Mode:</p>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Enter any 6-digit code (e.g., 123456) to complete registration
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
            >
              Verify & Create Account
            </button>
          </div>

          <div className="text-center">
            <a href="/register" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
              ← Change email address
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
}
