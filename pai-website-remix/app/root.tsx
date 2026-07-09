import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Footer } from "./components/Footer";

export const links: Route.LinksFunction = () => [];

export async function loader() {
  // Initialize workflows on server startup
  if (typeof window === 'undefined') {
    const { initializeWorkflows, initializeRenewalReminderWorkflow } = await import("./lib/workflow.server");
    await initializeWorkflows();
    await initializeRenewalReminderWorkflow();
  }
  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let statusCode = 500;
  let title = "Oops! Something went wrong";
  let message = "An unexpected error occurred. Please try again later.";
  let showDetails = false;
  let errorDetails: string | undefined;

  // Log error to console for debugging
  console.error("ErrorBoundary caught error:", error);

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    console.error(`Route error response: ${error.status} - ${error.statusText}`);
    
    switch (error.status) {
      case 404:
        title = "Page Not Found";
        message = "The page you're looking for doesn't exist or has been moved.";
        break;
      case 401:
        title = "Unauthorized";
        message = "You need to be logged in to access this page.";
        break;
      case 403:
        title = "Forbidden";
        message = "You don't have permission to access this page.";
        break;
      case 500:
        title = "Server Error";
        message = "Something went wrong on our end. We're working to fix it.";
        break;
      default:
        title = `Error ${error.status}`;
        message = error.statusText || message;
    }
  } else if (error && error instanceof Error) {
    // Only show error details in development
    if (import.meta.env.DEV) {
      showDetails = true;
      errorDetails = error.stack || error.message;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-sky-500 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-gray-900 dark:text-white">
                {statusCode}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white font-medium rounded-full hover:opacity-95 transition"
          >
            Go to Homepage
          </a>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Go Back
          </button>
        </div>

        {/* Development Error Details */}
        {showDetails && errorDetails && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔧 Developer Details (Development Only)
            </summary>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {errorDetails}
              </pre>
            </div>
          </details>
        )}

        {/* Help Text */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            If this problem persists, please contact support at{" "}
            <a 
              href="mailto:support@pgaoi.org" 
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              support@pgaoi.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
