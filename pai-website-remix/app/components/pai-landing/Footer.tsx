export function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="py-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-400">
      <div className="container mx-auto px-4">
        <p>© {year} Paragliding Association of India (PAI). All rights reserved.</p>
      </div>
    </footer>
  );
}
