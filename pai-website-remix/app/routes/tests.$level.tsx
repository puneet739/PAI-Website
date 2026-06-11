import type { Route } from "./+types/tests.$level";
import { Form, redirect, useActionData } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { getMemberById } from "~/lib/auth.server";
import { query } from "~/lib/db.server";
import { DashboardSidebar } from "~/components/DashboardSidebar";
import { useState, useEffect } from "react";
import { isValidTestLevel, getValidTestLevels } from "~/lib/constants";

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const member = await getMemberById(userId);

  if (!member) {
    throw redirect("/login");
  }

  const level = params.level?.toUpperCase();
  if (!level || !isValidTestLevel(level)) {
    throw redirect("/tests");
  }

  // Get 10 random questions for this level
  const questions = await query<Question>(
    "SELECT id, question, option_a, option_b, option_c, option_d, correct_answer FROM test_questions WHERE test_level = ? ORDER BY RAND() LIMIT 10",
    [level]
  );

  return { member, questions, level };
}

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const level = params.level?.toUpperCase();

  if (!level || !isValidTestLevel(level)) {
    return { error: "Invalid test level" };
  }

  // Get answers and time taken
  const answers = JSON.parse(formData.get("answers") as string);
  const timeTaken = parseInt(formData.get("timeTaken") as string);

  // Get correct answers
  const questionIds = Object.keys(answers).map(id => parseInt(id));
  const questions = await query<Question>(
    `SELECT id, correct_answer FROM test_questions WHERE id IN (${questionIds.join(',')})`,
    []
  );

  // Calculate score
  let score = 0;
  questions.forEach((q) => {
    if (answers[q.id] === q.correct_answer) {
      score++;
    }
  });

  const totalQuestions = questions.length;
  const passed = score >= 7; // 70% passing score

  // Save result
  await query(
    "INSERT INTO test_results (member_id, test_level, score, total_questions, passed, time_taken) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, level, score, totalQuestions, passed, timeTaken]
  );

  return redirect(`/tests/results?level=${level}&score=${score}&total=${totalQuestions}&passed=${passed}`);
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.level?.toUpperCase()} Test - PAI` },
    { name: "description", content: "Take your paragliding certification test" },
  ];
}

export default function TestLevel({ loaderData }: Route.ComponentProps) {
  const { member, questions, level } = loaderData;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const form = document.getElementById('test-form') as HTMLFormElement;
    if (form) {
      form.submit();
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar currentPath="/tests" userRole={member.role_name} membershipType={member.membership_type} isLifeMember={member.is_life_member} membershipStatus={member.membership_status} activeUntil={member.active_until} />

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{level} Certification Test</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{member.name}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</p>
                <p className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {answeredCount} answered
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-sky-500 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {currentQ.question}
            </h2>

            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText = currentQ[`option_${option.toLowerCase()}` as keyof Question] as string;
                const isSelected = answers[currentQ.id] === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(currentQ.id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500'
                          : 'border-gray-300 dark:border-gray-700'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{option}.</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{optionText}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-full font-medium transition ${
                    index === currentQuestion
                      ? 'bg-gradient-to-r from-sky-500 to-orange-500 text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 text-white hover:opacity-95 transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answeredCount < questions.length || isSubmitting}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>

          {/* Hidden Form */}
          <Form id="test-form" method="post" className="hidden">
            <input type="hidden" name="answers" value={JSON.stringify(answers)} />
            <input type="hidden" name="timeTaken" value={600 - timeLeft} />
          </Form>

          {/* Warning */}
          {answeredCount < questions.length && currentQuestion === questions.length - 1 && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ You have {questions.length - answeredCount} unanswered question(s). Please answer all questions before submitting.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
