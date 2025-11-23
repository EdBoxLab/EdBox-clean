import Link from 'next/link';

export default function ToolsPage() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">Tools</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <Link
          href="/ide"
          className="block p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">IDE</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Your personal coding environment.
          </p>
        </Link>

        <Link
          href="/research-assistant"
          className="block p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">Research Assistant</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Your AI-powered research assistant.
          </p>
        </Link>

        <Link
          href="/notes"
          className="block p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">Notes</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Create notes from PDFs, images, or prompts. Take notes with your voice or by writing.
          </p>
        </Link>

        <Link
          href="/quiz-forge"
          className="block p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">Quiz Forge</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Generate exhaustive quizzes of all types from an upload or a prompt.
          </p>
        </Link>

        <Link
          href="/flashcard-gen"
          className="block p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">Flashcard Gen</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Generate exhaustive flashcards from an upload or a prompt.
          </p>
        </Link>
         <Link
          href="/engines"
          className="block p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">Engines</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Access state of the art engines that makes visualizing any learning concepts possible
          </p>
        </Link>
      </div>
    </div>
  );
}
