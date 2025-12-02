import Link from "next/link";
import {
  AcademicCapIcon,
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function ToolsPage() {
  const tools = [
    {
      href: "/research-assistant",
      title: "Research Assistant",
      description: "Your AI-powered research assistant.",
      icon: AcademicCapIcon,
    },
    {
      href: "/notes",
      title: "Notes",
      description:
        "Create notes from PDFs, images, or prompts. Take notes with your voice or by writing.",
      icon: PencilSquareIcon,
    },
    {
      href: "/quiz-forge",
      title: "Quiz Forge",
      description:
        "Generate exhaustive quizzes of all types from an upload or a prompt.",
      icon: ClipboardDocumentListIcon,
    },
    {
      href: "/flashcard-gen",
      title: "Flashcard Gen",
      description:
        "Generate exhaustive flashcards from an upload or a prompt.",
      icon: RectangleStackIcon,
    },
    {
      href: "/engines",
      title: "Engines",
      description:
        "Access state of the art engines that make visualizing any learning concepts possible.",
      icon: Cog6ToothIcon,
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
        Tools
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <tool.icon className="h-8 w-8 text-emerald-500 group-hover:text-emerald-400 mr-3" />
              <h2 className="text-xl sm:text-2xl font-bold dark:text-white">
                {tool.title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
