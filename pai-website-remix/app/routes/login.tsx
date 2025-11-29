import type { Route } from "./+types/login";
import { Form, redirect, useActionData } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const { getUserId } = await import("~/lib/session.server");
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  
  // Check for password reset success
  const url = new URL(request.url);
  const resetSuccess = url.searchParams.get("reset") === "success";
  
  return { resetSuccess };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return {
      error: "Invalid form submission",
    };
  }

  if (!email || !password) {
    return {
      error: "Email and password are required",
    };
  }

  const { verifyLogin } = await import("~/lib/auth.server");
  const { createUserSession } = await import("~/lib/session.server");
  
  const member = await verifyLogin(email, password);

  if (!member) {
    return {
      error: "Invalid email or password",
    };
  }

  return createUserSession(member.id, "/dashboard");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - PAI" },
    { name: "description", content: "Login to your PAI member account" },
  ];
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const { resetSuccess } = loaderData || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            PAI Member Login
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          {resetSuccess && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Password reset successfully! You can now login with your new password.
              </p>
            </div>
          )}

          {actionData?.error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{actionData.error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-800 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-800 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>


          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-sky-500 to-orange-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
            >
              Sign in
            </button>
          </div>

          <div className="text-center space-y-2">
            <a href="/forgot-password" className="block text-sm text-sky-600 dark:text-sky-400 hover:underline font-medium">
              Forgot password?
            </a>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <a href="/register" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
                Register now
              </a>
            </p>
            <a href="/" className="block text-sm text-sky-600 dark:text-sky-400 hover:underline">
              ← Back to home
            </a>
          </div>
        </Form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Demo Accounts:</p>
          <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p><strong>Admin:</strong> admin@pai.org.in</p>
            <p><strong>Pilot:</strong> pilot@example.com</p>
            <p><strong>Beginner:</strong> beginner@example.com</p>
            <p className="mt-2"><strong>Password:</strong> password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
