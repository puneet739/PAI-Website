import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PAI – Paragliding Association of India" },
    {
      name: "description",
      content:
        "Official website of the Paragliding Association of India (PAI). Verify pilots and access your dashboard.",
    },
  ];
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Logo/Header */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Paragliding Association of India
          </h1>
          <p className="text-xl text-gray-600">
            Official Pilot Verification & Member Portal
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Verify Pilot Button */}
          <Link
            to="/verify-pilot"
            className="group relative px-8 py-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-sky-200 hover:border-sky-400 w-full sm:w-80"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Pilot</h2>
                <p className="text-sm text-gray-600">
                  Search and verify pilot credentials
                </p>
              </div>
            </div>
          </Link>

          {/* Dashboard/Login Button */}
          <Link
            to="/dashboard"
            className="group relative px-8 py-6 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-80"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Dashboard / Login</h2>
                <p className="text-sm text-white/90">
                  Access your member dashboard
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="pt-8 space-y-3">
          <p className="text-sm text-gray-500">
            For support, contact us at <a href="mailto:mc@pgaoi.org" className="text-sky-600 hover:underline">mc@pgaoi.org</a>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <Link to="/terms" className="hover:text-sky-600 hover:underline">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-sky-600 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
