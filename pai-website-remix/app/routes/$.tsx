import type { Route } from "./+types/$";

// Catch-all route for unmatched paths
// This handles Chrome DevTools requests and other 404s gracefully
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  
  // Silently ignore Chrome DevTools requests
  if (url.pathname.includes('.well-known')) {
    return new Response(null, { status: 404 });
  }
  
  // For other 404s, you could redirect to home or show a 404 page
  return new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
        <a 
          href="/" 
          className="text-sky-600 dark:text-sky-400 hover:underline"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
