export function Membership() {
  return (
    <section id="membership" className="py-12 bg-gray-50 dark:bg-gray-900/40">
      <div className="container mx-auto px-4 grid gap-6 md:grid-cols-[1.3fr,1fr] items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Membership</h2>
          <p className="text-gray-700 dark:text-gray-300">Become a PAI member to support safe growth of the sport, get updates, and participate in programs.</p>
          <ul className="list-disc ps-5 mt-3 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Community representation</li>
            <li>Safety and training resources</li>
            <li>Newsletter and updates</li>
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm bg-white dark:bg-gray-950">
          <h3 className="font-semibold mb-2">Join now</h3>
          <p className="text-gray-700 dark:text-gray-300">Membership portal coming soon. Meanwhile, write to us:</p>
          <p className="mt-3"><a className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-white bg-gradient-to-r from-sky-500 to-orange-500 shadow hover:opacity-95 transition w-full sm:w-auto" href="mailto:mc@pgaoi.org">mc@pgaoi.org</a></p>
        </div>
      </div>
    </section>
  );
}
