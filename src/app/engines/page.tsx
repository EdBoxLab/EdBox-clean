
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Code, Languages, BrainCircuit, FlaskConical, Landmark, Scroll, Sigma, Atom, PenTool } from "lucide-react";
import Link from "next/link";

const engines = [
    {
        title: "Art Studio",
        description: "AI-powered creative suite for image generation.",
        icon: <Palette className="h-8 w-8 text-orange-500" />,
        href: "/artstudio",
    },
    {
        title: "Code Studio",
        description: "Interactive environment for coding and development.",
        icon: <Code className="h-8 w-8 text-blue-500" />,
        href: "/codestudio",
    },
    {
        title: "Lingua Lab",
        description: "Practice and improve your language skills.",
        icon: <Languages className="h-8 w-8 text-green-500" />,
        href: "/lingualab",
    },
    {
        title: "BioNexus",
        description: "Explore the wonders of biology and life sciences.",
        icon: <BrainCircuit className="h-8 w-8 text-teal-500" />,
        href: "/bionexus",
    },
    {
        title: "ChemLab",
        description: "Simulate chemical reactions and experiments.",
        icon: <FlaskConical className="h-8 w-8 text-purple-500" />,
        href: "/chemlab",
    },
    {
        title: "FinLab",
        description: "Master financial concepts and market analysis.",
        icon: <Landmark className="h-8 w-8 text-yellow-500" />,
        href: "/finlab",
    },
    {
        title: "History Machine",
        description: "Travel through time and explore historical events.",
        icon: <Scroll className="h-8 w-8 text-amber-700" />,
        href: "/historymach",
    },
    {
        title: "MathLab",
        description: "Solve complex mathematical problems and visualize concepts.",
        icon: <Sigma className="h-8 w-8 text-red-500" />,
        href: "/mathlab",
    },
    {
        title: "Physics Simulator",
        description: "Experiment with the laws of physics in a virtual sandbox.",
        icon: <Atom className="h-8 w-8 text-cyan-500" />,
        href: "/physicssim",
    },
    {
        title: "Writing Studio",
        description: "Enhance your writing skills with AI-powered assistance.",
        icon: <PenTool className="h-8 w-8 text-indigo-500" />,
        href: "/writingstudio",
    },
];

export default function EnginesPage() {
    return (
        <div className="p-4 sm:p-6">
            <section className="mb-12">
                <h2 className="text-3xl font-bold mb-2">Engines</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                    Powerful, specialized environments for creation and learning.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {engines.map((tool) => (
                        <Link href={tool.href} key={tool.href}>
                            <Card className="cursor-pointer hover:shadow-xl hover:border-blue-500/50 transition-all transform hover:-translate-y-1 h-full flex flex-col">
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
