"use client";
import { UserButton } from "@clerk/nextjs"
import { ArrowRight, Code, ImageIcon, MessageSquare, Music, VideoIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import Link from "next/link";


const tools = [
    {
        label: "Conversation",
        icon: MessageSquare,
        href: "/conversation",
        bgClor: "text-violet-500",
    },
    {
        label: "Image Generation",
        icon: ImageIcon,
        href: "/image",
        bgClor: "text-pink-700",
    },
    {
        label: "Video generation",
        icon: VideoIcon,
        href: "/video",
        bgClor: "text-orange-700",
    },
    {
        label: "Music Generation",
        icon: Music,
        href: "/music",
        bgClor: "text-emerald-500",
    },
    {
        label: "Code Generation",
        icon: Code,
        href: "/code",
        bgClor: "text-green-500",
    }
];

const DashboardPage = () => {
    // const router = useRouter();
    

    return(
        <div>
            <div className="mb-8 space-y-4">
                <h2 className="text-2xl md:text-4xl font-bold">
                Explore the power of AlmerGPT
                </h2>
                <p className="text-muted-foreground font-light
                text-sm md:text-lg text-center">
                    Chat with the smartest AI - Experience the power of Almer
                </p>
            </div>
            <div className="px-4 md:px-20 lg:px-32 space-y-4">
                {tools.map((tool) => (
                    <Link href={tool.href} key={tool.href}>
                        <Card
                            // onClick={() => router.push(tool.href)}
                            
                            className="p-4 border-black/5 flex items-center
                            justify-between hover:shadow-md transition cursor-pointer mb-2"
                        >
                            <div className="flex items-center gap-x-4">
                                <div className={cn("p-2 w-fit rounded-md",
                                    tool.bgClor
                                )}>
                                    <tool.icon className={cn("w-8 h-8", tool.bgClor)}/>
                                </div>
                                <div className="font-semibold">
                                    {tool.label}
                                </div>
                            </div>
                            <ArrowRight/>
                        </Card>
                    </Link>
                    
                ))}
            </div>
        </div>
    )
}

export default DashboardPage;