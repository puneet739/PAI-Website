export function Hero() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_20%_20%,rgba(14,165,233,.15),transparent_60%),radial-gradient(70%_60%_at_80%_0%,rgba(249,115,22,.12),transparent_60%)]"
        aria-hidden
      />
      <div className="container mx-auto px-4">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
          Paragliding Association of India
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
          Advancing the sport of paragliding across India with safety, training, and community.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-white bg-gradient-to-r from-sky-500 to-orange-500 shadow hover:opacity-95 transition" href="#membership">Join PAI</a>
          <a className="inline-flex items-center justify-center rounded-full px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition" href="#training">Find Training</a>
        </div>
      </div>
    </section>
  );
}
