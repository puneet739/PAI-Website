export function Safety() {
  return (
    <section id="safety" className="py-12 bg-gray-50 dark:bg-gray-900/40">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-4">Safety First</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ul className="list-disc ps-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Understand weather and micro-meteorology</li>
            <li>Pre-flight checks: wing, lines, harness, reserve</li>
            <li>Radio communication and site briefings</li>
            <li>Progress gradually; avoid flying alone</li>
          </ul>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-gradient-to-b from-sky-100/50 to-orange-100/40 dark:from-sky-900/20 dark:to-orange-900/10">
            <strong>Emergency?</strong>
            <p className="text-gray-700 dark:text-gray-300 mt-1">Contact local authorities and your instructor. File an incident report to help the community learn.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
