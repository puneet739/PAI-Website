export function About() {
  return (
    <section id="about" className="py-12">
      <div className="container mx-auto px-4 grid gap-6 md:grid-cols-[1.3fr,1fr] items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-3">About PAI</h2>
          <p className="text-gray-700 dark:text-gray-300">
            PAI is the national body working to promote paragliding in India. We support pilots and schools,
            advocate for responsible flying, and organize training, safety initiatives, and community events.
          </p>
          <ul className="list-disc ps-5 mt-3 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Standards for training and instruction</li>
            <li>Safety guidelines and incident reporting</li>
            <li>Community events and competitions</li>
            <li>Recognition for pilots and schools</li>
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm bg-white dark:bg-gray-950">
          <h3 className="font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-1 text-blue-700 dark:text-blue-500">
            <li><a className="hover:underline" href="#membership">Become a member</a></li>
            <li><a className="hover:underline" href="#training">Accredited schools</a></li>
            <li><a className="hover:underline" href="#safety">Safety resources</a></li>
            <li><a className="hover:underline" href="#events">Upcoming events</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
