/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Heading from "@/components/heading";
import React, { useRef, useEffect } from 'react';
import { Download, MessageSquare } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./constants";
import { FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
// import Empty from "@/components/empty";
import Loader from "@/components/loader";
// import UserAvatar from "@/components/user-avatar";
import BotAvatar from "@/components/bot-avatar";
import { Card, CardFooter } from "@/components/ui/card";
import Image from "next/image";

// Message type definition
type Message = {
  role: "user" | "assistant";
  content: string;
};

const ConversationPage = () => {
  const [images, setImages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [images]);

  // Initialize the form with react-hook-form and zod resolver
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = formMethods.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setImages([]);
      const response = await axios.post("/api/image", values);
      console.log("Response from API:", response.data);

      // Fixed: Extract URLs correctly from the API response
      const urls = response.data.images.map((image: { url: string }) => image.url);
      setImages(urls);
      console.log("Images set to state:", urls);
      formMethods.reset();
    } catch (error: any) {
      console.error("Error during submission:", error);
      // Consider adding user-friendly error handling here
      if (error.response?.data?.error) {
        // You could show this error to the user via a toast or alert
        console.error("API Error:", error.response.data.error);
      }
    }
  };

  return (
    <div>
      {/* Page heading */}
      <Heading
        title="Conversation"
        description="Amazing conversation"
        icon={MessageSquare}
        iconColor="text-violet-500"
        bgColor="bg-violet-500/10"
      />

      <div className="px-4 lg:px-8">
        <FormProvider {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(onSubmit)}
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
          >
            {/* Form Field for "prompt" */}
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                      placeholder="Input prompt"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Submit Button */}
            <Button
              type="submit"
              className="col-span-12 lg:col-span-2 w-full"
              disabled={isLoading}
            >
              Generate
            </Button>
          </form>
        </FormProvider>
      </div>


      {/* Messages display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
              <BotAvatar />
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full p-6 mb-4">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-500 max-w-sm">Ask me anything! I&apos;m here to help with questions, creative tasks, problem-solving, and more.</p>
          </div>
        )}

        {/* Messages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
          {images.map((msg, index) => {
            const src = typeof msg === "string" ? msg : msg.content;
            return (
              <Card key={`${src}-${index}`} className="rounded-lg overflow-hidden">
                <div className="relative aspect-square">
                  <Image alt="Generated image" fill src={src} />
                </div>
                <CardFooter className="p-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => window.open(src)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ConversationPage;
