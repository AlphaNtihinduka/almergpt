"use client";

import Heading from "@/components/heading";
import { VideoIcon } from "lucide-react";
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

const VideoPage = () => {
  const [video, setVideo] = useState<string>();
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: "" },
  });

  const isLoading = formMethods.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setVideo(undefined);
      const response = await axios.post("/api/video", values);
      setVideo(response.data.video);
      console.log("video display: ",response.data.video)
    } catch (error: any) {
      console.error("Error during submission:", error);
    }
  };

  return (
    <div>
      <Heading
        title="Music"
        description="Amazing music"
        icon={VideoIcon}
        iconColor="text-orange-700"
        bgColor="bg-orange-700/10"
      />
      <div className="px-4 lg:px-8">
        <FormProvider {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(onSubmit)}
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      placeholder="Input prompt"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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
      <div className="space-y-4 mt-4">
        {isLoading && (
          <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
            <Loader />
          </div>
        )}
        {!video && !isLoading && <Empty label="No video generated." />}
        {video && (
          <video className="w-full mt-8 aspect-video rounded-lg border bg-black" controls>
            <source src={video} />
          </video>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
