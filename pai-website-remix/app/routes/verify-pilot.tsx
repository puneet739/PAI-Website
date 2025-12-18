import type { Route } from "./+types/verify-pilot";
import { getRatingLabel } from "~/lib/constants";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";

interface PilotInfo {
  id: number;
  membership_id: string | null;
  name: string;
  profile_image: string | null;
  pilot_rating: string;
  membership_status: "active" | "inactive" | "pending";
  active_until: string | null;
  insurance_amount: number | null;
  insurance_policy_number: string | null;
  insurance_valid_until: string | null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify Pilot - PAI" },
    { name: "description", content: "Search and verify PAI pilot credentials" },
  ];
}

export default function VerifyPilot() {
  const [searchParams] = useSearchParams();
  const membershipIdParam = searchParams.get("membershipid") || searchParams.get("q");
  
  const [searchQuery, setSearchQuery] = useState(membershipIdParam || "");
  const [searchResults, setSearchResults] = useState<PilotInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search-pilot?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Auto-search when URL parameter is present
  useEffect(() => {
    if (membershipIdParam) {
      performSearch(membershipIdParam);
    }
  }, [membershipIdParam]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Mask membership ID - show only last 3 digits
  const maskMembershipId = (membershipId: string | null, pilotId: number) => {
    const id = membershipId || `PAI-MEM-${String(pilotId).padStart(5, '0')}`;
    if (id.length <= 3) return id;
    return '•••' + id.slice(-3);
  };

  // Mask policy number - show only last 4 digits
  const maskPolicyNumber = (policyNumber: string) => {
    if (policyNumber.length <= 4) return policyNumber;
    return '••••' + policyNumber.slice(-4);
  };

  // Check if date is valid (not expired)
  const isDateValid = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) >= new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            PAI
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Verify Pilot</h1>
          <p className="text-lg text-gray-600">
            Search by pilot name or membership ID to verify credentials
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter pilot name or membership ID..."
              className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-sky-500 focus:outline-none text-lg text-gray-900 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-6">
            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pilots found</h3>
                <p className="text-gray-600">Try searching with a different name or membership ID</p>
              </div>
            ) : (
              searchResults.map((pilot) => (
                <div
                  key={pilot.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600">
                          {pilot.profile_image ? (
                            <img
                              src={pilot.profile_image}
                              alt={pilot.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                              {pilot.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pilot Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">{pilot.name}</h2>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Membership ID:</span>
                            <span className="text-lg font-bold text-sky-600">
                              {maskMembershipId(pilot.membership_id, pilot.id)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Rating */}
                          <div className="bg-sky-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Current Rating</p>
                            <p className="text-xl font-bold text-gray-900">{getRatingLabel(pilot.pilot_rating)}</p>
                          </div>

                          {/* Membership Status */}
                          <div className="bg-sky-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Membership Status</p>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const isExpired = pilot.active_until && new Date(pilot.active_until) < new Date();
                                const displayStatus = isExpired ? "Need to Renew" : pilot.membership_status;
                                const statusColor = isExpired 
                                  ? "bg-orange-100 text-orange-800"
                                  : pilot.membership_status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : pilot.membership_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800";
                                
                                return (
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}
                                  >
                                    {isExpired ? displayStatus : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Membership Validity */}
                          {pilot.active_until && (
                            <div className="bg-sky-50 rounded-lg p-4">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Membership Validity</p>
                              <p className="text-lg font-bold text-gray-900">
                                {isDateValid(pilot.active_until) ? (
                                  <span className="text-green-600">Valid</span>
                                ) : (
                                  <span className="text-red-600">Expired</span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Insurance */}
                          {pilot.insurance_amount && (
                            <div className="bg-sky-50 rounded-lg p-4">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Insurance Status</p>
                              <p className="text-lg font-bold text-gray-900">
                                {isDateValid(pilot.insurance_valid_until) ? (
                                  <span className="text-green-600">Valid</span>
                                ) : (
                                  <span className="text-red-600">Expired</span>
                                )}
                              </p>
                              {pilot.insurance_policy_number && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Policy: {maskPolicyNumber(pilot.insurance_policy_number)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
