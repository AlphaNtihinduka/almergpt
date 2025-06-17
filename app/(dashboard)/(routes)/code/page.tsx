/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Heading from "@/components/heading";
import { CodeIcon, Copy, Check, AlertCircle, Trash2, Download } from "lucide-react";
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
import axios from "axios";
import { useState, useCallback, useRef, useEffect } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";
import UserAvatar from "@/components/user-avatar";
import BotAvatar from "@/components/bot-avatar";
import ReactMarkDown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from "sonner"; // Assuming you have sonner for toasts

// Enhanced message type with metadata
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  responseTime?: number;
  error?: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Enhanced copy to clipboard function
  const copyToClipboard = useCallback(async (text: string, messageId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(messageId || text);
      toast.success("Code copied to clipboard!");
      
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
    toast.success("Code downloaded successfully!");
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setApiError("");
    toast.success("Conversation cleared");
  }, []);

  // Enhanced submit handler with better error handling
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    const startTime = Date.now();
    setApiError("");

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

      // Send messages to the API endpoint
      const response = await axios.post("/api/code", {
        messages: newMessages.map(({ id, timestamp, tokensUsed, responseTime, error, ...msg }) => msg),
        temperature: 0.7,
        maxTokens: 1500,
      });

      const responseTime = Date.now() - startTime;

      // Create assistant message with metadata
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.data.content,
        timestamp: new Date(),
        tokensUsed: response.data.metadata?.tokensUsed,
        responseTime,
      };

      setMessages((current) => [...current, assistantMessage]);
      toast.success("Code generated successfully!");

    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      console.error("Error during submission:", error);

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

      setMessages((current) => [...current, errorMessage]);
      toast.error(apiError.error);
    }
  };

  // Custom code block component with copy functionality
  const CodeBlock = ({ language, children }: { language: string; children: string }) => {
    const messageId = `code-${Date.now()}-${Math.random()}`;
    const isCopied = copiedCode === messageId;

    return (
      <div className="relative group">
        <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 text-sm rounded-t-lg">
          <span className="font-mono">{language || 'code'}</span>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(children, messageId)}
                  >
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
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
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
          }}
          showLineNumbers
          wrapLines
        >
          {children}
        </SyntaxHighlighter>
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
          className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono" 
          {...props}
        >
          {children}
        </code>
      );
    },
    pre({ children }: React.PropsWithChildren<object>) {
      return <>{children}</>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page heading */}
      <Heading
        title="AI Code Generator"
        description="Generate high-quality code with AI assistance"
        icon={CodeIcon}
        iconColor="text-green-700"
        bgColor="bg-green-700/10"
      />

      {/* Input form */}
      <div className="px-4 lg:px-8 pb-4">
        <FormProvider {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(onSubmit)}
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2 bg-white dark:bg-slate-900"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent text-base"
                      placeholder="Describe the code you want to generate (e.g., 'Create a React component for a music player')"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="col-span-12 lg:col-span-2 flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Generating..." : "Generate"}
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

        {/* Error display */}
        {apiError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Messages display */}
      <div className="flex-1 px-4 lg:px-8 pb-4">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {isLoading && messages.length > 0 && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <Loader />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Generating code...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {messages.length === 0 && !isLoading && (
              <Empty label="No conversation started. Ask me to generate some code!" />
            )}

            <div className="space-y-6">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`${
                    message.role === "user" 
                      ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
                      : message.error
                      ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
                      : "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={message.role === "user" ? "default" : "secondary"}>
                            {message.role === "user" ? "You" : "AI Assistant"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.responseTime && (
                            <span className="text-xs text-muted-foreground">
                              • {message.responseTime}ms
                            </span>
                          )}
                          {message.tokensUsed && (
                            <span className="text-xs text-muted-foreground">
                              • {message.tokensUsed} tokens
                            </span>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkDown components={markdownComponents}>
                            {message.content || ""}
                          </ReactMarkDown>
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