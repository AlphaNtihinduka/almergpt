"use client";
import { ArrowRight, Code, ImageIcon, MessageSquare, Music, VideoIcon, Sparkles, Zap, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

const tools = [
    {
        label: "Conversation",
        icon: MessageSquare,
        href: "/conversation",
        color: "from-violet-600 to-purple-600",
        textColor: "text-violet-600",
        bgGlow: "bg-violet-500/10",
        description: "Engage in intelligent conversations with advanced AI"
    },
    {
        label: "Image Generation",
        icon: ImageIcon,
        href: "/image",
        color: "from-pink-600 to-rose-600",
        textColor: "text-pink-600",
        bgGlow: "bg-pink-500/10",
        description: "Create stunning visuals from your imagination"
    },
    {
        label: "Video Generation",
        icon: VideoIcon,
        href: "/video",
        color: "from-orange-600 to-red-600",
        textColor: "text-orange-600",
        bgGlow: "bg-orange-500/10",
        description: "Bring your ideas to life with AI-generated videos"
    },
    {
        label: "Music Generation",
        icon: Music,
        href: "/music",
        color: "from-emerald-600 to-teal-600",
        textColor: "text-emerald-600",
        bgGlow: "bg-emerald-500/10",
        description: "Compose melodies and beats with AI assistance"
    },
    {
        label: "Code Generation",
        icon: Code,
        href: "/code",
        color: "from-blue-600 to-cyan-600",
        textColor: "text-blue-600",
        bgGlow: "bg-blue-500/10",
        description: "Generate clean, efficient code in any language"
    }
];

const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Floating background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-violet-200 to-purple-200 dark:from-violet-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-pink-200 to-rose-200 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        <Sparkles className="w-8 h-8 text-violet-600 animate-pulse" />
                        <span className="text-sm font-semibold uppercase tracking-wider">AI-Powered Innovation</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent leading-tight">
                        Explore the Power of
                        <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            AlmerGPT
                        </span>
                    </h1>
                    
                    <div className="max-w-2xl mx-auto">
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                            Unleash your creativity with our suite of intelligent AI tools. 
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-medium"> Experience the future today.</span>
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>Lightning Fast</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <div className="flex items-center gap-1">
                            <Brain className="w-4 h-4 text-violet-500" />
                            <span>AI-Powered</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>5+ Tools Available</span>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="max-w-4xl mx-auto">
                    <div className="grid gap-6 md:gap-8">
                        {tools.map((tool) => (
                            <Link href={tool.href} key={tool.href} className="group">
                                <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                                    {/* Gradient border effect */}
                                    <div className={cn(
                                        "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                        tool.color
                                    )}>
                                        <div className="absolute inset-[1px] bg-white dark:bg-slate-800 rounded-lg"></div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="relative p-8 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            {/* Icon container */}
                                            <div className={cn(
                                                "relative p-4 rounded-2xl transition-all duration-500 group-hover:scale-110",
                                                tool.bgGlow
                                            )}>
                                                {/* Glowing effect */}
                                                <div className={cn(
                                                    "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500",
                                                    tool.color
                                                )}></div>
                                                
                                                <tool.icon className={cn(
                                                    "relative w-10 h-10 transition-all duration-500",
                                                    tool.textColor
                                                )} />
                                            </div>

                                            {/* Text content */}
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-500"
                                                    style={{
                                                        backgroundImage: `linear-gradient(to right, ${tool.color.split(' ')[1]}, ${tool.color.split(' ')[3]})`
                                                    }}>
                                                    {tool.label}
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                                                    {tool.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Arrow with enhanced animation */}
                                        <div className="relative">
                                            <div className={cn(
                                                "absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-all duration-500",
                                                tool.bgGlow
                                            )}></div>
                                            <ArrowRight className={cn(
                                                "relative w-6 h-6 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110",
                                                tool.textColor,
                                                "text-slate-400 group-hover:text-current"
                                            )} />
                                        </div>
                                    </div>

                                    {/* Animated shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16 space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        Ready to transform your workflow?
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 font-medium">
                        <span>Choose a tool above to get started</span>
                        <ArrowRight className="w-4 h-4 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;