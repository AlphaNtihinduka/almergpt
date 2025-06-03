"use client";

import Heading from "@/components/heading";
import { VideoIcon, Settings, Download, Play, AlertCircle } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import axios from "axios";
import { useState, useCallback } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";

// Enhanced form schema with additional parameters
const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt must be less than 500 characters"),
  fps: z.number().min(12).max(60).default(24),
  width: z.number().min(256).max(1920).default(1024),
  height: z.number().min(256).max(1080).default(576),
  guidance_scale: z.number().min(1).max(20).default(17.5),
  negative_prompt: z.string().default("very blue, dust, noisy, washed out, ugly, distorted, broken"),
  duration: z.number().min(1).max(10).default(3)
});

// API Response types
interface VideoGenerationResponse {
  success: boolean;
  video?: string;
  predictionId?: string;
  status?: string;
  error?: string;
  metadata?: {
    duration?: string;
    format?: string;
    resolution?: string;
    fps?: number;
  };
}

// Preset configurations
const presets = {
  standard: { fps: 24, width: 1024, height: 576, guidance_scale: 17.5 },
  hd: { fps: 30, width: 1280, height: 720, guidance_scale: 15 },
  cinematic: { fps: 24, width: 1920, height: 1080, guidance_scale: 20 },
  square: { fps: 24, width: 1024, height: 1024, guidance_scale: 17.5 },
};

const VideoPage = () => {
  const [video, setVideo] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [predictionId, setPredictionId] = useState<string>();
  const [metadata, setMetadata] = useState<VideoGenerationResponse['metadata']>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      fps: 24,
      width: 1024,
      height: 576,
      guidance_scale: 17.5,
      negative_prompt: "very blue, dust, noisy, washed out, ugly, distorted, broken",
      duration: 3
    },
  });

  // Poll for video generation status
  const pollStatus = useCallback(async (predictionId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/video?predictionId=${predictionId}`);
        const data: VideoGenerationResponse = response.data;

        if (data.success && data.status === "succeeded" && data.video) {
          setVideo(data.video);
          setProgress(100);
          setIsGenerating(false);
          return;
        }

        if (data.status === "failed") {
          throw new Error(data.error || "Video generation failed");
        }

        // Update progress based on attempts
        setProgress(Math.min((attempts / maxAttempts) * 90, 90));
        attempts++;

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error("Video generation timeout");
        }
      } catch (error) {
        console.error("Polling error:", error);
        setError(error instanceof Error ? error.message : "Failed to check generation status");
        setIsGenerating(false);
        setProgress(0);
      }
    };

    poll();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setVideo(undefined);
      setError(undefined);
      setIsGenerating(true);
      setProgress(10);
      setPredictionId(undefined);
      setMetadata(undefined);

      console.log("Submitting video generation request:", values);

      const response = await axios.post("/api/video", values);
      const data: VideoGenerationResponse = response.data;

      if (!data.success) {
        throw new Error(data.error || "Video generation failed");
      }

      setProgress(20);
      setMetadata(data.metadata);

      if (data.predictionId) {
        setPredictionId(data.predictionId);
        // Start polling for status
        pollStatus(data.predictionId);
      } else if (data.video) {
        // Direct response (mock mode)
        setVideo(data.video);
        setProgress(100);
        setIsGenerating(false);
      }

    } catch (error) {
      console.error("Error during submission:", error);
      // Check if error is an AxiosError to access response
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
          error.message ||
          "An unexpected error occurred"
        );
      } else if (error instanceof Error) {
        setError(
          error.message ||
          "An unexpected error occurred"
        );
      } else {
        setError("An unexpected error occurred");
      }
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const applyPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];
    formMethods.setValue("fps", preset.fps);
    formMethods.setValue("width", preset.width);
    formMethods.setValue("height", preset.height);
    formMethods.setValue("guidance_scale", preset.guidance_scale);
  };

  const downloadVideo = () => {
    if (video) {
      const link = document.createElement('a');
      link.href = video;
      link.download = `generated-video-${Date.now()}.mp4`;
      link.click();
    }
  };

  return (
    <div>
      <Heading
        title="Video Generation"
        description="Create amazing videos with AI"
        icon={VideoIcon}
        iconColor="text-orange-700"
        bgColor="bg-orange-700/10"
      />
      
      <div className="px-4 lg:px-8">
        <FormProvider {...formMethods}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5" />
                Video Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
                {/* Main Prompt */}
                <FormField
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the video you want to generate (e.g., 'A majestic eagle soaring over snow-capped mountains at golden hour')"
                          disabled={isGenerating}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("standard")}
                    disabled={isGenerating}
                  >
                    Standard
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("hd")}
                    disabled={isGenerating}
                  >
                    HD
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("cinematic")}
                    disabled={isGenerating}
                  >
                    Cinematic
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset("square")}
                    disabled={isGenerating}
                  >
                    Square
                  </Button>
                </div>

                {/* Advanced Settings */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Advanced Settings
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        name="fps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frame Rate (FPS)</FormLabel>
                            <Select
                              disabled={isGenerating}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="12">12 FPS</SelectItem>
                                <SelectItem value="24">24 FPS</SelectItem>
                                <SelectItem value="30">30 FPS</SelectItem>
                                <SelectItem value="60">60 FPS</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={256}
                                max={1920}
                                step={64}
                                disabled={isGenerating}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={256}
                                max={1080}
                                step={64}
                                disabled={isGenerating}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="guidance_scale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guidance Scale</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                step={0.5}
                                disabled={isGenerating}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (seconds)</FormLabel>
                            <Select
                              disabled={isGenerating}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="3">3 seconds</SelectItem>
                                <SelectItem value="5">5 seconds</SelectItem>
                                <SelectItem value="7">7 seconds</SelectItem>
                                <SelectItem value="10">10 seconds</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      name="negative_prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Negative Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What you don't want in the video"
                              disabled={isGenerating}
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 w-4 h-4" />
                      Generate Video
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FormProvider>

        {/* Progress and Status */}
        {isGenerating && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating your video...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {predictionId && (
                  <p className="text-xs text-muted-foreground">
                    Prediction ID: {predictionId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Video Result */}
        <div className="mt-6">
          {!video && !isGenerating && !error && (
            <Empty label="No video generated yet. Enter a prompt and click generate!" />
          )}
          
          {video && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Video</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadVideo}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent>
                <video 
                  className="w-full aspect-video rounded-lg border bg-black" 
                  controls
                  preload="metadata"
                >
                  <source src={video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {metadata && (
                  <div className="mt-4 text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                    {metadata.resolution && (
                      <div>
                        <strong>Resolution:</strong> {metadata.resolution}
                      </div>
                    )}
                    {metadata.fps && (
                      <div>
                        <strong>FPS:</strong> {metadata.fps}
                      </div>
                    )}
                    {metadata.format && (
                      <div>
                        <strong>Format:</strong> {metadata.format.toUpperCase()}
                      </div>
                    )}
                    {metadata.duration && (
                      <div>
                        <strong>Duration:</strong> {metadata.duration}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;