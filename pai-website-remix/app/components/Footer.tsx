export function Footer() {
  console.log("Footer: Developed and contributed by Charan Kumar");
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Developed and contributed by{" "}
          <span className="font-medium text-gray-900 dark:text-white"> <a  href="mailto:puneet739@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">Charan Kumar</a></span>
          
        </div>
      </div>
    </footer>
  );
}
