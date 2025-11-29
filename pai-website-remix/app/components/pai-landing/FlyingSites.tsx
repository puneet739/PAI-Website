export function FlyingSites() {
  const sites = [
    {
      name: "Bir Billing, Himachal",
      description: "The Himalayan mecca for XC and soaring, with world-class conditions."
    },
    {
      name: "Kamshet, Maharashtra",
      description: "Training-friendly ridges with reliable winds near Pune and Mumbai."
    },
    {
      name: "Nandi Hills, Karnataka",
      description: "Scenic morning flights and ridge soaring near Bengaluru."
    },
    {
      name: "Yelagiri, Tamil Nadu",
      description: "Beginner-friendly conditions and a vibrant local community."
    }
  ];

  return (
    <section id="sites" className="py-12 bg-gray-50 dark:bg-gray-900/40">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">Popular Flying Sites</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sites.map((site) => (
            <article key={site.name} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950 shadow-sm">
              <h3 className="font-semibold">{site.name}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">{site.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
