
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Cpu, PenSquare } from "lucide-react";
import Link from "next/link";

const tools = [
  {
    title: "Flashcard Generation",
    description: "Generate flashcards from your notes",
    icon: <PenSquare className="h-8 w-8" />,
    href: "/flashcard-gen",
  },
  {
    title: "Quiz Forge",
    description: "Create quizzes from your notes",
    icon: <Cpu className="h-8 w-8" />,
    href: "/quiz-forge",
  },
  {
    title: "Notes",
    description: "Take and organize your notes",
    icon: <DollarSign className="h-8 w-8" />,
    href: "/notes",
  },
];

export default function ToolsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => (
        <Link href={tool.href} key={tool.href}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {tool.title}
              </CardTitle>
              {tool.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tool.title}</div>
              <p className="text-xs text-muted-foreground">
                {tool.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
