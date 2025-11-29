export function Training() {
  return (
    <section id="training" className="py-12">
      <div className="container mx-auto px-4 grid gap-6 md:grid-cols-[1.3fr,1fr] items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Training &amp; Certification</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Learn with accredited schools following standardized syllabi. Progress from ground handling to soaring,
            thermalling, and cross-country under experienced instructors.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-xs px-3 py-1">Beginner (P1/P2)</span>
            <span className="rounded-full border border-purple-200 bg-purple-50 text-purple-800 text-xs px-3 py-1">Intermediate (P3/P4)</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs px-3 py-1">Advanced (XC/Tandem)</span>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm bg-white dark:bg-gray-950">
          <h3 className="font-semibold mb-2">How to start</h3>
          <ol className="list-decimal ps-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Choose an accredited school</li>
            <li>Finish ground school &amp; supervised flights</li>
            <li>Log airtime and progress ratings</li>
            <li>Fly responsibly with a mentor</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
