/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Heading from "@/components/heading";
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Send, Copy, RefreshCw, Trash2, User } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
import Loader from "@/components/loader";
import BotAvatar from "@/components/bot-avatar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// Define the form schema properly
const formSchema = z.object({
  prompt: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
});

// Enhanced message type with metadata
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

// Custom hooks for better state management
const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const regenerateResponse = useCallback(async (messageId: string, onSubmit: (messages: Message[]) => Promise<void>) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Remove the assistant message and all subsequent messages
    const messagesUpToUser = messages.slice(0, messageIndex);
    setMessages(messagesUpToUser);
    
    // Trigger regeneration
    await onSubmit(messagesUpToUser);
  }, [messages]);

  return {
    messages,
    addMessage,
    clearMessages,
    removeMessage,
    regenerateResponse,
  };
};

const ConversationPage = () => {
  const { messages, addMessage, clearMessages, regenerateResponse } = useMessages();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll with improved UX
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Form setup with enhanced validation
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: "" },
    mode: "onChange",
  });

  // Optimized message formatting for API
  const formatMessagesForAPI = useCallback((messageHistory: Message[]) => {
    return messageHistory
      .filter(msg => msg.role !== "system" && !msg.isError)
      .map(({ role, content }) => ({ role, content }));
  }, []);

  // Enhanced submit handler with proper error handling and debugging
  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>, messageHistory?: Message[]) => {
    const currentMessages = messageHistory || messages;
    
    console.log("🚀 Form submission started", { values, currentMessages });
    
    // Validate the input
    if (!values.prompt?.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📤 Setting loading state to true");
      
      // Add user message immediately for better UX
      const userMessage = addMessage({
        role: "user",
        content: values.prompt.trim(),
      });
      console.log("👤 Added user message", userMessage);

      // Prepare messages for API
      const apiMessages = formatMessagesForAPI([...currentMessages, userMessage]);
      console.log("📋 Formatted messages for API", apiMessages);

      // Call the conversation API with detailed logging
      console.log("🌐 Making API call to /api/conversation");
      const response = await axios.post("/api/conversation", {
        messages: apiMessages,
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log("✅ API response received", { 
        status: response.status, 
        data: response.data 
      });

      // Validate response
      if (!response.data) {
        throw new Error("Empty response from server");
      }

      const assistantContent = response.data.content || 
                              response.data.message || 
                              response.data.text ||
                              "I apologize, but I couldn't generate a response.";

      // Add assistant response
      const assistantMessage = addMessage({
        role: "assistant",
        content: assistantContent,
      });
      console.log("🤖 Added assistant message", assistantMessage);

      // Reset form
      formMethods.reset();
      console.log("🔄 Form reset");
      
      // Refocus input for better UX
      setTimeout(() => {
        inputRef.current?.focus();
        console.log("🎯 Input refocused");
      }, 100);
      
    } catch (error: any) {
      console.error("❌ Conversation error:", error);
      
      // Log detailed error information
      if (error.response) {
        console.error("🔍 Error response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error("🔍 Error request:", error.request);
      } else {
        console.error("🔍 Error message:", error.message);
      }
      
      // Add error message to chat
      addMessage({
        role: "assistant",
        content: `I apologize, but I encountered an error: ${error.message || "Please try again."}`,
        isError: true,
      });

      // Show appropriate toast notification
      if (error.code === 'ECONNABORTED') {
        toast.error("Request timeout. Please try again.");
      } else if (error.response?.status === 401) {
        toast.error("Authentication required. Please sign in.");
      } else if (error.response?.status === 400) {
        toast.error("Invalid request format. Please check your message.");
      } else if (error.response?.status === 404) {
        toast.error("API endpoint not found. Please check your server configuration.");
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(`Error: ${error.message || "Something went wrong"}`);
      }
    } finally {
      setIsLoading(false);
      console.log("🏁 Loading state set to false");
    }
  }, [messages, addMessage, formatMessagesForAPI, formMethods]);

  // Copy message to clipboard
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Message copied to clipboard!");
    } catch {
      toast.error("Failed to copy message");
    }
  }, []);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const currentValue = formMethods.getValues('prompt');
        if (!isLoading && currentValue?.trim()) {
          console.log("⌨️ Keyboard shortcut triggered submission");
          formMethods.handleSubmit((values) => onSubmit(values))();
        }
      }
      
      // Escape to clear input
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        formMethods.reset();
        console.log("⌨️ Input cleared via Escape key");
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [formMethods, onSubmit, isLoading]);

  // Debug current form state
  const currentPrompt = formMethods.watch('prompt');
  const isSubmitDisabled = isLoading || !currentPrompt?.trim();

  console.log("🔍 Current form state:", { 
    currentPrompt, 
    isLoading, 
    isSubmitDisabled,
    messagesCount: messages.length 
  });

  // Memoized components for performance
  const EmptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-full p-8 mb-6 shadow-lg">
        <MessageSquare className="w-16 h-16 text-violet-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
        Start Your Conversation
      </h3>
      <p className="text-gray-600 max-w-md leading-relaxed mb-6">
        Ask me anything! I`m here to help with questions, creative tasks, problem-solving, and thoughtful discussions.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
          <span>to send</span>
        </div>
        <div className="flex items-center space-x-2">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
          <span>to clear input</span>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced heading with actions */}
      <div className="flex items-center justify-between mb-6">
        <Heading
          title="AI Conversation"
          description="Intelligent chat powered by advanced language models"
          icon={MessageSquare}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />
        
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            className="text-gray-600 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Input form with enhanced styling and debugging */}
      <div className="px-4 lg:px-8 mb-6">
        <FormProvider {...formMethods}>
          <form
            onSubmit={(e) => {
              console.log("📝 Form onSubmit triggered", e);
              e.preventDefault();
              formMethods.handleSubmit((values) => {
                console.log("🎯 Form validation passed, calling onSubmit", values);
                onSubmit(values);
              })(e);
            }}
            className="relative bg-white rounded-2xl border-2 border-gray-100 hover:border-violet-200 focus-within:border-violet-300 focus-within:shadow-lg transition-all duration-200 p-4"
          >
            <div className="flex items-end space-x-3">
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        className="border-0 bg-transparent text-base placeholder:text-gray-400 focus-visible:ring-0 resize-none min-h-[2.5rem] max-h-32"
                        placeholder="Type your message... (Ctrl+Enter to send)"
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          console.log("📝 Input changed:", e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                            if (field.value?.trim() && !isLoading) {
                              console.log("⏎ Enter key submission triggered");
                              formMethods.handleSubmit((values) => onSubmit(values))();
                            }
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                onClick={() => console.log("🖱️ Submit button clicked")}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>

      {/* Messages container with improved scrolling */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading ? (
            EmptyState
          ) : (
            <div className="space-y-6 pb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <BotAvatar />
                      )}
                    </div>

                    {/* Message content */}
                    <Card className={`relative px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl rounded-tr-sm' 
                        : message.isError 
                          ? 'bg-red-50 border-red-200 text-red-800 rounded-2xl rounded-tl-sm' 
                          : 'bg-gray-50 border-gray-200 rounded-2xl rounded-tl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.content}
                      </div>
                      
                      {/* Message timestamp */}
                      <div className={`text-xs mt-2 opacity-60 ${message.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {/* Message actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/20 rounded-md"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        {message.role === 'assistant' && !message.isError && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-white/20 rounded-md"
                            onClick={() => regenerateResponse(message.id, (msgs) => 
                              onSubmit({
                                prompt: msgs[msgs.length - 1]?.content || '',
                              }, msgs.slice(0, -1))
                            )}
                            disabled={isLoading}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start group">
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    <BotAvatar />
                    <Card className="bg-gray-50 border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <Loader />
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ConversationPage;