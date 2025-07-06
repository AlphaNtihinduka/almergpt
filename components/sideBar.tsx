"use client"
import Link from "next/link";
import Image from "next/image";
import {
    Code,
    ImageIcon,
    LayoutDashboard,
    MessageSquare,
    Music,
    Settings,
    VideoIcon,
    Sparkles,
    ChevronRight,
    // Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import RequestFooter from "./RequestFooter";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
        gradient: "from-sky-500 to-blue-600",
        bgGlow: "bg-sky-500/10",
        description: "Overview & Analytics"
    },
    {
        label: "Conversation",
        icon: MessageSquare,
        href: "/conversation",
        color: "text-violet-500",
        gradient: "from-violet-500 to-purple-600",
        bgGlow: "bg-violet-500/10",
        description: "AI Chat Interface"
    },
    {
        label: "Image Generation",
        icon: ImageIcon,
        href: "/image",
        color: "text-pink-600",
        gradient: "from-pink-500 to-rose-600",
        bgGlow: "bg-pink-500/10",
        description: "Visual Creation"
    },
    {
        label: "Video Generation",
        icon: VideoIcon,
        href: "/video",
        color: "text-orange-600",
        gradient: "from-orange-500 to-red-600",
        bgGlow: "bg-orange-500/10",
        description: "Motion Graphics"
    },
    {
        label: "Music Generation",
        icon: Music,
        href: "/music",
        color: "text-emerald-500",
        gradient: "from-emerald-500 to-teal-600",
        bgGlow: "bg-emerald-500/10",
        description: "Audio Synthesis"
    },
    {
        label: "Code Generation",
        icon: Code,
        href: "/code",
        color: "text-blue-500",
        gradient: "from-blue-500 to-cyan-600",
        bgGlow: "bg-blue-500/10",
        description: "Programming Assistant"
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        color: "text-slate-400",
        gradient: "from-slate-400 to-slate-600",
        bgGlow: "bg-slate-500/10",
        description: "Preferences & Config"
    }
];

const SideBar = () => {
    const pathname = usePathname();

    return (
        <div className="relative flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 backdrop-blur-xl">
            {/* Ambient background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-10 w-40 h-40 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 -right-10 w-32 h-32 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header Section */}
                <div className="p-6 border-b border-slate-700/50">
                    <Link
                        href="/"
                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                    >
                        <div className="relative">
                            {/* Glow effect behind logo */}
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg p-2 flex items-center justify-center">
                                <Image
                                    width={24}
                                    height={24}
                                    alt="AlmerGPT"
                                    src="/Almer.png"
                                    className="relative z-10"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                AlmerGPT
                            </h2>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI-Powered Suite
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-6 space-y-2">
                    {routes.map((route, index) => {
                        const isActive = pathname === route.href;
                        const isSettings = route.href === "/settings";

                        return (
                            <div key={route.href} className="relative">
                                <Link
                                    href={route.href}
                                    className={cn(
                                        "group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 overflow-hidden",
                                        isActive
                                            ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className={cn(
                                            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b transition-all duration-300",
                                            route.gradient
                                        )}></div>
                                    )}

                                    {/* Gradient background for active state */}
                                    {isActive && (
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-r opacity-10 rounded-xl",
                                            route.gradient
                                        )}></div>
                                    )}

                                    {/* Icon container */}
                                    <div className={cn(
                                        "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
                                        isActive ? route.bgGlow : "group-hover:bg-white/5"
                                    )}>
                                        {/* Icon glow effect */}
                                        {isActive && (
                                            <div className={cn(
                                                "absolute inset-0 rounded-lg blur-md opacity-30",
                                                route.bgGlow
                                            )}></div>
                                        )}

                                        <route.icon className={cn(
                                            "relative w-5 h-5 transition-all duration-300",
                                            isActive ? route.color : "text-slate-500 group-hover:text-slate-300"
                                        )} />
                                    </div>

                                    {/* Text content */}
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "font-medium text-sm transition-all duration-300",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                        )}>
                                            {route.label}
                                        </div>
                                        <div className={cn(
                                            "text-xs transition-all duration-300 opacity-0 group-hover:opacity-100",
                                            isActive ? "text-slate-300" : "text-slate-500"
                                        )}>
                                            {route.description}
                                        </div>
                                    </div>

                                    {/* Chevron indicator */}
                                    <ChevronRight className={cn(
                                        "w-4 h-4 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
                                        isActive ? "opacity-100 translate-x-0" : ""
                                    )} />

                                    {/* Hover shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                                </Link>

                                {/* Separator line before settings */}
                                {isSettings && index > 0 && (
                                    <div className="my-4 mx-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                {/* <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">Pro Plan</div>
                            <div className="text-xs text-slate-400 truncate">
                                Unlimited access
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                </div> */}
                <RequestFooter />
            </div>
        </div>
    );
};

export default SideBar;