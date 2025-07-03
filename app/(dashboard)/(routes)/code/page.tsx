/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Heading from "@/components/heading";
import {
  CodeIcon,
  Copy,
  Check,
  AlertCircle,
  Trash2,
  Download,
  Send,
  Sparkles,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  History // Add this import
} from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./constants";
import { FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { useState, useCallback, useRef, useEffect } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";
import UserAvatar from "@/components/user-avatar";
import BotAvatar from "@/components/bot-avatar";
import ReactMarkDown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from "sonner";
import { HistoryModal } from "@/components/HistoryModal";
import ConversationHistory from "@/components/Code_conversation_history";

// Enhanced message type with metadata
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  responseTime?: number;
  error?: boolean;
  isStreaming?: boolean;
};

// Error type for better error handling
type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

const CodePage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedCode, setCopiedCode] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [typingAnimation, setTypingAnimation] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize the form with react-hook-form and zod resolver
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = formMethods.formState.isSubmitting;

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount and after form submission
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Enhanced copy to clipboard function
  const copyToClipboard = useCallback(async (text: string, messageId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(messageId || text);
      toast.success("Code copied to clipboard!", {
        duration: 2000,
        icon: "📋"
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  }, []);

  // Download code as file
  const downloadCode = useCallback((code: string, language: string = "txt") => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Code downloaded successfully!", {
      duration: 2000,
      icon: "⬇️"
    });
  }, []);

  // Clear all messages with confirmation
  const clearMessages = useCallback(() => {
    if (messages.length === 0) return;

    setMessages([]);
    setApiError("");
    setStreamingProgress(0);
    toast.success("Conversation cleared", {
      duration: 2000,
      icon: "🗑️"
    });
  }, [messages.length]);

  // Simulate streaming progress
  const simulateStreaming = useCallback(() => {
    setStreamingProgress(0);
    const interval = setInterval(() => {
      setStreamingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Enhanced submit handler with better error handling
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.prompt.trim()) {
      toast.error("Please enter a prompt", { icon: "⚠️" });
      return;
    }

    const startTime = Date.now();
    setApiError("");
    setTypingAnimation(true);

    const cleanupStreaming = simulateStreaming();

    try {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: values.prompt.trim(),
        timestamp: new Date(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Clear the form
      formMethods.reset();

      // Add streaming placeholder
      const streamingMessage: Message = {
        id: `streaming-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages(prev => [...prev, streamingMessage]);

      // Send messages to the API endpoint
      const response = await axios.post("/api/code", {
        messages: newMessages.map(({ id, timestamp, tokensUsed, responseTime, error, isStreaming, ...msg }) => msg),
        temperature: 0.7,
        maxTokens: 1500,
      });

      const responseTime = Date.now() - startTime;

      // Remove streaming message and add real response
      setMessages(prev => prev.filter(msg => !msg.isStreaming));

      // Create assistant message with metadata
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.data.content,
        timestamp: new Date(),
        tokensUsed: response.data.metadata?.tokensUsed,
        responseTime,
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success("Code generated successfully!", {
        duration: 3000,
        icon: "✨"
      });

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      console.error("Error during submission:", error);

      // Remove streaming message
      setMessages(prev => prev.filter(msg => !msg.isStreaming));

      // Handle API errors gracefully
      let apiError: ApiError = { error: "Network error occurred" };
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: unknown } }).response?.data === "object"
      ) {
        apiError = (error as { response: { data: ApiError } }).response.data;
      }
      setApiError(apiError.error);

      // Add error message to conversation
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ **Error**: ${apiError.error}\n\n${apiError.code ? `**Code**: ${apiError.code}` : ''}`,
        timestamp: new Date(),
        responseTime,
        error: true,
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error(apiError.error, { icon: "❌" });
    } finally {
      setTypingAnimation(false);
      setStreamingProgress(100);
      cleanupStreaming();
    }
  };

  // Custom code block component with enhanced features
  const CodeBlock = ({ language, children }: { language: string; children: string }) => {
    const messageId = `code-${Date.now()}-${Math.random()}`;
    const isCopied = copiedCode === messageId;
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = children.split('\n').length > 20;

    return (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 text-slate-200 px-4 py-3 text-sm rounded-t-lg border border-slate-600">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <span className="font-mono font-medium">{language || 'code'}</span>
            <Badge variant="secondary" className="text-xs">
              {children.split('\n').length} lines
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {shouldTruncate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-600 transition-all duration-200"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isExpanded ? "Collapse" : "Expand"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-600 transition-all duration-200"
                    onClick={() => copyToClipboard(children, messageId)}
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCopied ? "Copied!" : "Copy code"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-600 transition-all duration-200"
                    onClick={() => downloadCode(children, language)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-b-lg border-x border-b border-slate-600">
          {shouldTruncate && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>
          )}
          <SyntaxHighlighter
            language={language.toLowerCase()}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              maxHeight: shouldTruncate && !isExpanded ? '400px' : 'none',
              overflow: shouldTruncate && !isExpanded ? 'hidden' : 'auto',
            }}
            showLineNumbers
            wrapLines
          >
            {children}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  // Enhanced markdown components
  const markdownComponents = {
    code({
      inline,
      className,
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { inline?: boolean; className?: string; children?: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language) {
        return <CodeBlock language={language}>{String(children).replace(/\n$/, '')}</CodeBlock>;
      }

      return (
        <code
          className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-sm font-mono border"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre({ children }: React.PropsWithChildren<object>) {
      return <>{children}</>;
    },
    h1: ({ children }: React.PropsWithChildren<object>) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-slate-100">{children}</h1>
    ),
    h2: ({ children }: React.PropsWithChildren<object>) => (
      <h2 className="text-xl font-semibold mt-5 mb-3 text-slate-800 dark:text-slate-200">{children}</h2>
    ),
    h3: ({ children }: React.PropsWithChildren<object>) => (
      <h3 className="text-lg font-medium mt-4 mb-2 text-slate-700 dark:text-slate-300">{children}</h3>
    ),
    p: ({ children }: React.PropsWithChildren<object>) => (
      <p className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>
    ),
    ul: ({ children }: React.PropsWithChildren<object>) => (
      <ul className="list-disc list-inside mb-3 space-y-1 ml-4">{children}</ul>
    ),
    ol: ({ children }: React.PropsWithChildren<object>) => (
      <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">{children}</ol>
    ),
  };

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Enhanced page heading */}
      <div className="relative">
        <Heading
          title="AI Code Generator"
          description="Generate high-quality code with advanced AI assistance"
          icon={CodeIcon}
          iconColor="text-emerald-600"
          bgColor="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20"
        />

        {/* Controls bar */}
        <div className="px-4 lg:px-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showMetadata}
                  onCheckedChange={setShowMetadata}
                  id="metadata-toggle"
                />
                <label htmlFor="metadata-toggle" className="text-sm text-muted-foreground cursor-pointer">
                  Show metadata
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {messages.filter(m => m.role === 'user').length} prompts
                </Badge>
              )}

              {/* Add History Modal Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsHistoryOpen(true)}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View conversation history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced input form */}
      <div className="px-4 lg:px-8 pb-4 relative">
        <FormProvider {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(onSubmit)}
            className="relative rounded-xl border-2 border-slate-200 dark:border-slate-700 w-full p-4 px-3 md:px-6 focus-within:border-emerald-500 focus-within:shadow-lg focus-within:shadow-emerald-500/10 transition-all duration-300 grid grid-cols-12 gap-2 bg-white dark:bg-slate-900 backdrop-blur-sm"
          >
            {/* Streaming progress indicator */}
            {isLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-t-xl overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${streamingProgress}%` }}
                />
              </div>
            )}

            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      ref={(el) => {
                        field.ref(el);
                        // Assign to inputRef only if not null and inputRef is not read-only
                        // Remove the assignment to inputRef.current to avoid error
                      }}
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent text-base placeholder:text-slate-400 bg-transparent"
                      placeholder="Describe the code you want to generate... (e.g., 'Create a React component for a music player with play/pause functionality')"
                      disabled={isLoading}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          formMethods.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="col-span-12 lg:col-span-2 flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span>Generate</span>
                  </div>
                )}
              </Button>
              {messages.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={clearMessages}
                        disabled={isLoading}
                        className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear conversation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </form>
        </FormProvider>

        {/* History Modal */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title="Conversation History"
        >
          <ConversationHistory />
        </HistoryModal>

        {/* Enhanced error display */}
        {apiError && (
          <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Keyboard shortcut hint */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border text-xs">Ctrl/Cmd + Enter</kbd> to generate
        </div>
      </div>

      {/* Enhanced messages display */}
      <div className="flex-1 px-4 lg:px-8 pb-4 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6 pb-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-2xl blur-xl"></div>
                </div>
                <Empty label="Ready to generate amazing code!" />
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Describe what you want to build, and I`ll generate high-quality, production-ready code for you.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message, index) => (
                <Card
                  key={message.id}
                  className={`group transition-all duration-300 hover:shadow-md ${message.role === "user"
                    ? "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-blue-50/20 dark:from-blue-900/10 dark:to-blue-900/5 shadow-sm"
                    : message.error
                      ? "border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-red-50/20 dark:from-red-900/10 dark:to-red-900/5 shadow-sm"
                      : message.isStreaming
                        ? "border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-yellow-50/20 dark:from-yellow-900/10 dark:to-yellow-900/5 shadow-sm animate-pulse"
                        : "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-emerald-50/20 dark:from-emerald-900/10 dark:to-emerald-900/5 shadow-sm"
                    }`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 relative">
                        <div className={`p-0.5 rounded-full ${message.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600"
                          : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                          }`}>
                          {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                        </div>
                        {message.isStreaming && (
                          <div className="absolute -bottom-1 -right-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant={message.role === "user" ? "default" : "secondary"}
                            className={`${message.role === "user"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                              } font-medium`}
                          >
                            {message.role === "user" ? "You" : "AI Assistant"}
                          </Badge>

                          {showMetadata && (
                            <>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{message.timestamp.toLocaleTimeString()}</span>
                              </div>

                              {message.responseTime && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Zap className="h-3 w-3" />
                                  <span>{message.responseTime}ms</span>
                                </div>
                              )}

                              {message.tokensUsed && (
                                <Badge variant="outline" className="text-xs">
                                  {message.tokensUsed} tokens
                                </Badge>
                              )}
                            </>
                          )}

                          {message.isStreaming && (
                            <Badge variant="outline" className="text-xs animate-pulse">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </Badge>
                          )}
                        </div>

                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {message.isStreaming ? (
                            <div className="flex items-center gap-2 py-4">
                              <Loader />
                              <span className="text-sm text-muted-foreground">
                                Analyzing your request and generating code...
                              </span>
                            </div>
                          ) : (
                            <ReactMarkDown components={markdownComponents}>
                              {message.content || ""}
                            </ReactMarkDown>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodePage;