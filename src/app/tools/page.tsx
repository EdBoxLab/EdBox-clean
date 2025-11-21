
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenSquare, Share2, BookCopy, TestTube, Bot } from "lucide-react";
import Link from "next/link";

const tools = [
    {
        title: "Engines",
        description: "Powerful, specialized environments for creation and learning.",
        icon: <Bot className="h-8 w-8 text-blue-500" />,
        href: "/engines",
    },
    {
        title: "Flashcard Generation",
        description: "Generate flashcards from your notes",
        icon: <BookCopy className="h-8 w-8 text-yellow-500" />,
        href: "/flashcard-gen",
    },
    {
        title: "Quiz Forge",
        description: "Create quizzes from your notes",
        icon: <TestTube className="h-8 w-8 text-purple-500" />,
        href: "/quiz-forge",
    },
    {
        title: "Notes",
        description: "Take and organize your notes",
        icon: <PenSquare className="h-8 w-8 text-red-500" />,
        href: "/notes",
    },
    {
        title: "Socials",
        description: "Connect with your friends",
        icon: <Share2 className="h-8 w-8 text-indigo-500" />,
        href: "/socials",
    },
];

export default function ToolsPage() {
    return (
        <div className="p-4 sm:p-6">
            <section>
                <h2 className="text-3xl font-bold mb-6">Tools & Engines</h2>
                 <p className="text-muted-foreground mb-6 max-w-2xl">
                    A collection of utilities, and powerful, specialized environments to support your learning journey.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool) => (
                        <Link href={tool.href} key={tool.href}>
                            <Card className="cursor-pointer hover:shadow-xl hover:border-purple-500/50 transition-all transform hover:-translate-y-1 h-full flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-semibold">
                                        {tool.title}
                                    </CardTitle>
                                    {tool.icon}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">
                                        {tool.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
