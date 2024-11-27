"use client";

import Heading from "@/components/heading";
import { MessageSquare } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./constants";
import { FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";

// Message type definition
type Message = {
  role: "user" | "assistant";
  content: string;
};

const ConversationPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize the form with react-hook-form and zod resolver
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = formMethods.formState.isSubmitting;

  // Submit handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userMessage: Message = {
        role: "user",
        content: values.prompt,
      };

      const newMessages = [...messages, userMessage];

      // Send messages to the API endpoint
      const response = await axios.post("/api/conversation", {
        messages: newMessages,
      });

      // Append user message and API response to the conversation
      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.content,
      };

      setMessages((current) => [...current, userMessage, assistantMessage]);
    } catch (error: any) {
      console.error("Error during submission:", error);
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
      <div className="space-y-4 mt-4">
        {isLoading && (
          <div className="p-8 rounded-lg w-full flex items-center
          justify-center bg-muted">
            <Loader/>
          </div>
        )}
        {messages.length === 0 && !isLoading && (
          <Empty label={"No conversation started."} />
        )}
        <div className="flex flex-col-reverse gap-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.role === "user" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
