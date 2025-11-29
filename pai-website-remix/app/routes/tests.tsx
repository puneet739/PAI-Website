import type { Route } from "./+types/tests";
import { redirect } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";

interface TestResult {
  test_level: string;
  score: number;
  total_questions: number;
  passed: boolean;
  created_at: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  // Get user's test history
  const testResults = await query<TestResult>(
    "SELECT test_level, score, total_questions, passed, created_at FROM test_results WHERE member_id = ? ORDER BY created_at DESC LIMIT 10",
    [userId]
  );

  return { member, testResults };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tests - PAI" },
    { name: "description", content: "Take paragliding certification tests" },
  ];
}

export default function Tests({ loaderData }: Route.ComponentProps) {
  const { member, testResults } = loaderData;

  const testLevels = [
    {
      level: 'P1',
      name: 'Beginner Pilot',
      description: 'Basic paragliding knowledge and safety',
      color: 'from-green-500 to-emerald-500',
      icon: '🪂',
    },
    {
      level: 'P2',
      name: 'Novice Pilot',
      description: 'Intermediate flying techniques and theory',
      color: 'from-blue-500 to-cyan-500',
      icon: '🌤️',
    },
    {
      level: 'P3',
      name: 'Intermediate Pilot',
      description: 'Advanced maneuvers and weather understanding',
      color: 'from-orange-500 to-amber-500',
      icon: '⛰️',
    },
    {
      level: 'P4',
      name: 'Advanced Pilot',
      description: 'Expert level XC flying and competition knowledge',
      color: 'from-purple-500 to-pink-500',
      icon: '🏆',
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/tests" />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Certification Tests</h1>
            <a href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Home
            </a>
          </div>
        </header>

        <main className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Paragliding Certification Tests
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Test your knowledge and advance your pilot rating
            </p>
          </div>

          {/* Test Levels Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {testLevels.map((test) => (
              <a
                key={test.level}
                href={`/tests/${test.level.toLowerCase()}`}
                className="block bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition group"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${test.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
                  {test.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{test.level}</h3>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{test.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{test.description}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-sky-600 dark:text-sky-400">
                  <span>Start Test</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>

          {/* Test Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">Test Information</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Duration:</strong> 10 minutes per test</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span><strong>Questions:</strong> 10 multiple choice questions</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Passing Score:</strong> 70% (7 out of 10 correct)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span><strong>Retakes:</strong> Unlimited attempts allowed</span>
              </li>
            </ul>
          </div>

          {/* Test History */}
          {testResults.length > 0 && (
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Test Results</h3>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${result.passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} flex items-center justify-center`}>
                        {result.passed ? (
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{result.test_level} Test</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(result.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {result.score}/{result.total_questions}
                      </p>
                      <p className={`text-sm font-medium ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
