export function Header() {
  return (
    <header className="sticky top-0 bg-white/80 dark:bg-gray-950/60 backdrop-blur border-b border-gray-200 dark:border-gray-800 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#content" className="flex items-center gap-2 font-bold" aria-label="PAI Home">
          <span className="text-xl bg-gradient-to-r from-sky-500 to-orange-500 bg-clip-text text-transparent">PAI</span>
          <span className="sr-only">Paragliding Association of India</span>
        </a>
        <nav className="hidden sm:flex gap-4 text-sm text-gray-700 dark:text-gray-300">
          <a className="hover:underline" href="#about">About</a>
          <a className="hover:underline" href="#sites">Flying Sites</a>
          <a className="hover:underline" href="#training">Training</a>
          <a className="hover:underline" href="#safety">Safety</a>
          <a className="hover:underline" href="#events">Events</a>
          <a className="hover:underline" href="#membership">Membership</a>
          <a className="hover:underline" href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
