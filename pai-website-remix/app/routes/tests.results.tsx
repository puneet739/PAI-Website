import type { Route } from "./+types/tests.results";
import { redirect } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  const url = new URL(request.url);
  const level = url.searchParams.get("level");
  const score = parseInt(url.searchParams.get("score") || "0");
  const total = parseInt(url.searchParams.get("total") || "10");
  const passed = url.searchParams.get("passed") === "true";

  if (!level) {
    throw redirect("/tests");
  }

  return { member, level, score, total, passed };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Test Results - PAI" },
    { name: "description", content: "Your test results" },
  ];
}

export default function TestResults({ loaderData }: Route.ComponentProps) {
  const { member, level, score, total, passed } = loaderData;
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/tests" userRole={member.role_name} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Test Results</h1>
            <a href="/tests" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ← Back to Tests
            </a>
          </div>
        </header>

        <main className="p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="max-w-2xl w-full">
            {/* Result Card */}
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg text-center">
              {/* Icon */}
              <div className={`w-24 h-24 mx-auto rounded-full ${passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} flex items-center justify-center mb-6`}>
                {passed ? (
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Result */}
              <h2 className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {passed ? 'Congratulations!' : 'Not Quite There'}
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                {passed 
                  ? `You passed the ${level} certification test!`
                  : `You didn't pass the ${level} test this time.`
                }
              </p>

              {/* Score */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
                <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                  {score}/{total}
                </div>
                <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                  {percentage}%
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {passed 
                    ? 'You scored above the 70% passing threshold'
                    : 'You need 70% (7/10) to pass'
                  }
                </div>
              </div>

              {/* Message */}
              <div className={`p-4 rounded-lg mb-6 ${passed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
                <p className={`text-sm ${passed ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                  {passed 
                    ? `Great job, ${member.name}! Your test result has been recorded. You can now proceed to the next level or retake this test to improve your score.`
                    : `Don't worry, ${member.name}! Review the material and try again. You can retake the test as many times as needed.`
                  }
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <a
                  href="/tests"
                  className="px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  Back to Tests
                </a>
                <a
                  href={`/tests/${level.toLowerCase()}`}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition"
                >
                  Retake Test
                </a>
                {passed && (
                  <a
                    href="/dashboard"
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-95 transition"
                  >
                    Go to Dashboard
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{level}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Test Level</div>
              </div>
              <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{score}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Correct Answers</div>
              </div>
              <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
