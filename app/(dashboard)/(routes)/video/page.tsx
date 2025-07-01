"use client";

import Heading from "@/components/heading";
import { VideoIcon, Settings, Download, Play, AlertCircle, Clock, Users, Zap, Sparkles, Eye, Timer } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { useState, useCallback, useEffect, useRef } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";

// Enhanced form schema with priority
const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(500, "Prompt must be less than 500 characters"),
  fps: z.number().min(12).max(30).default(15),
  width: z.number().min(256).max(1024).default(512),
  height: z.number().min(256).max(1024).default(512),
  guidance_scale: z.number().min(1).max(15).default(7.5),
  negative_prompt: z.string().default("blurry, low quality"),
  duration: z.number().min(1).max(5).default(2),
  priority: z.enum(["ultra_fast", "fast", "quality"]).default("ultra_fast"),
  num_inference_steps: z.number().min(10).max(50).default(20)
});

// Enhanced API Response types
interface VideoGenerationResponse {
  success: boolean;
  video?: string;
  predictionId?: string;
  status?: string;
  error?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
  cached?: boolean;
  progress?: number;
  message?: string;
  metadata?: {
    duration?: string;
    format?: string;
    resolution?: string;
    fps?: number;
  };
}

// Optimized presets for speed
const presets = {
  ultra_fast: {
    fps: 15, width: 512, height: 512, guidance_scale: 7.5,
    priority: "ultra_fast" as const, num_inference_steps: 15, duration: 2
  }
};

// Sample prompts for inspiration
const samplePrompts = [
  "A majestic eagle soaring over snow-capped mountains at golden hour",
  "Waves crashing against rocky cliffs during a storm",
  "A cat playing with butterflies in a sunny garden",
  "Northern lights dancing over a frozen lake",
  "Steam rising from a hot cup of coffee on a rainy day",
  "Fireflies glowing in a magical forest at twilight",
  "A paper airplane floating through clouds",
  "Raindrops creating ripples on a calm pond"
];

// Fun facts to display while waiting
const funFacts = [
  "AI can generate a 3-second video in about 15 seconds!",
  "The first AI-generated video was created in 2016",
  "Your video is being created by analyzing millions of video frames",
  "AI video models can understand physics and motion",
  "Each frame is generated individually and then combined smoothly",
  "The AI is creating approximately 45 individual frames for your video",
  "Video AI models are trained on thousands of hours of footage"
];

const VideoPage = () => {
  const [video, setVideo] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [predictionId, setPredictionId] = useState<string>();
  const [metadata, setMetadata] = useState<VideoGenerationResponse['metadata']>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number>();
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number>();
  const [currentFunFact, setCurrentFunFact] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isQueued, setIsQueued] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number>();
  const [cachedResult, setCachedResult] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  const factIntervalRef = useRef<NodeJS.Timeout>();
  const timeElapsedRef = useRef<NodeJS.Timeout>();

  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      fps: 15,
      width: 512,
      height: 512,
      guidance_scale: 7.5,
      negative_prompt: "blurry, low quality",
      duration: 2,
      priority: "ultra_fast",
      num_inference_steps: 20
    },
  });

  // Cleanup intervals
  const cleanupIntervals = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (factIntervalRef.current) clearInterval(factIntervalRef.current);
    if (timeElapsedRef.current) clearInterval(timeElapsedRef.current);
  }, []);

  // Enhanced polling with better UX
  const pollStatus = useCallback(async (predictionId: string, formValues: z.infer<typeof formSchema>) => {
    const maxAttempts = 120; // 10 minutes with 5-second intervals
    let attempts = 0;
    let lastProgress = 0;

    // Start fun facts rotation
    factIntervalRef.current = setInterval(() => {
      setCurrentFunFact(prev => (prev + 1) % funFacts.length);
    }, 4000);

    // Start elapsed time counter
    timeElapsedRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const poll = async () => {
      try {
        const params = new URLSearchParams({
          predictionId,
          prompt: formValues.prompt,
          width: formValues.width.toString(),
          height: formValues.height.toString(),
          fps: formValues.fps.toString(),
          duration: formValues.duration.toString(),
          priority: formValues.priority
        });

        const response = await axios.get(`/api/video?${params}`);
        const data: VideoGenerationResponse = response.data;

        if (data.success && data.status === "succeeded" && data.video) {
          setVideo(data.video);
          setProgress(100);
          setIsGenerating(false);
          setIsQueued(false);
          cleanupIntervals();

          if (generationStartTime) {
            const totalTime = Math.round((Date.now() - generationStartTime) / 1000);
            console.log(`Video generated in ${totalTime} seconds`);
          }
          return;
        }

        if (data.status === "failed") {
          throw new Error(data.error || "Video generation failed");
        }

        // Enhanced progress calculation
        let newProgress = lastProgress;

        if (data.progress !== undefined) {
          newProgress = data.progress;
        } else if (data.status === "processing") {
          // Estimate progress based on time and priority
          const timeProgress = Math.min((attempts * 5) / (estimatedWaitTime || 30) * 80, 80);
          newProgress = Math.max(timeProgress, lastProgress + 2);
        } else {
          newProgress = Math.min(lastProgress + 1, 90);
        }

        setProgress(Math.min(newProgress, 95));
        lastProgress = newProgress;
        attempts++;

        if (attempts < maxAttempts) {
          intervalRef.current = setTimeout(poll, 5000);
        } else {
          throw new Error("Video generation timeout - please try again");
        }
      } catch (error) {
        console.error("Polling error:", error);
        setError(error instanceof Error ? error.message : "Failed to check generation status");
        setIsGenerating(false);
        setIsQueued(false);
        setProgress(0);
        cleanupIntervals();
      }
    };

    // Start polling immediately
    poll();
  }, [cleanupIntervals, estimatedWaitTime, generationStartTime]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Reset state
      setVideo(undefined);
      setError(undefined);
      setIsGenerating(true);
      setIsQueued(false);
      setProgress(5);
      setPredictionId(undefined);
      setMetadata(undefined);
      setQueuePosition(undefined);
      setEstimatedWaitTime(undefined);
      setTimeElapsed(0);
      setCachedResult(false);
      setGenerationStartTime(Date.now());

      console.log("Submitting optimized video generation request:", values);

      const response = await axios.post("/api/video", values);
      const data: VideoGenerationResponse = response.data;

      if (!data.success) {
        throw new Error(data.error || "Video generation failed");
      }

      // Handle cached results
      if (data.cached && data.video) {
        setVideo(data.video);
        setProgress(100);
        setIsGenerating(false);
        setCachedResult(true);
        setMetadata(data.metadata);
        return;
      }

      // Handle queue status
      if (data.status === "queued") {
        setIsQueued(true);
        setQueuePosition(data.queuePosition);
        setEstimatedWaitTime(data.estimatedWaitTime);
        setProgress(10);

        // Start polling for queue status
        const checkQueue = async () => {
          try {
            const queueResponse = await axios.post("/api/video", values);
            const queueData: VideoGenerationResponse = queueResponse.data;

            if (queueData.predictionId) {
              setIsQueued(false);
              setPredictionId(queueData.predictionId);
              setEstimatedWaitTime(queueData.estimatedWaitTime);
              pollStatus(queueData.predictionId, values);
            } else if (queueData.status === "queued") {
              setQueuePosition(queueData.queuePosition);
              setTimeout(checkQueue, 5000);
            }
          } catch (error) {
            console.error("Queue check error:", error);
          }
        };

        setTimeout(checkQueue, 5000);
        return;
      }

      setProgress(15);
      setMetadata(data.metadata);
      setEstimatedWaitTime(data.estimatedWaitTime);

      if (data.predictionId) {
        setPredictionId(data.predictionId);
        pollStatus(data.predictionId, values);
      } else if (data.video) {
        // Direct response (mock mode)
        setVideo(data.video);
        setProgress(100);
        setIsGenerating(false);
      }

    } catch (error) {
      console.error("Error during submission:", error);
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
          error.message ||
          "An unexpected error occurred"
        );
      } else if (error instanceof Error) {
        setError(error.message || "An unexpected error occurred");
      } else {
        setError("An unexpected error occurred");
      }
      setIsGenerating(false);
      setIsQueued(false);
      setProgress(0);
      cleanupIntervals();
    }
  };

  const applyPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];
    Object.entries(preset).forEach(([key, value]) => {
      formMethods.setValue(key as keyof z.infer<typeof formSchema>, value);
    });
  };

  const handleSamplePrompt = (prompt: string) => {
    formMethods.setValue("prompt", prompt);
  };

  const downloadVideo = () => {
    if (video) {
      const link = document.createElement('a');
      link.href = video;
      link.download = `ai-video-${Date.now()}.mp4`;
      link.click();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupIntervals();
  }, [cleanupIntervals]);

  return (
    <div>
      <Heading
        title="AI Video Generation"
        description="Create stunning videos with AI in seconds"
        icon={VideoIcon}
        iconColor="text-orange-700"
        bgColor="bg-orange-700/10"
      />

      <div className="px-4 lg:px-8">
        <FormProvider {...formMethods}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <VideoIcon className="w-5 h-5" />
                    Video Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Prompt with samples */}
                    <FormField
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your video..."
                              disabled={isGenerating}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {samplePrompts.slice(0, 3).map((prompt, index) => (
                              <Button
                                key={index}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSamplePrompt(prompt)}
                                disabled={isGenerating}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {prompt.substring(0, 20)}...
                              </Button>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Priority Selection */}
                    <FormField
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generation Speed</FormLabel>
                          <Select
                            disabled={isGenerating}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ultra_fast">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  Ultra Fast (~15s)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Quick Presets */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset("ultra_fast")}
                        disabled={isGenerating}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Ultra Fast
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            name="width"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Width</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={256}
                                    max={1024}
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
                                    max={1024}
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
                            name="fps"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frame Rate</FormLabel>
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
                                    <SelectItem value="15">15 FPS</SelectItem>
                                    <SelectItem value="20">20 FPS</SelectItem>
                                    <SelectItem value="24">24 FPS</SelectItem>
                                    <SelectItem value="30">30 FPS</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration</FormLabel>
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
                                    <SelectItem value="2">2 seconds</SelectItem>
                                    <SelectItem value="3">3 seconds</SelectItem>
                                    <SelectItem value="4">4 seconds</SelectItem>
                                    <SelectItem value="5">5 seconds</SelectItem>
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
                                  placeholder="What to avoid in the video"
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
                          {isQueued ? "In Queue..." : "Generating..."}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sample Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4" />
                    Prompt Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {samplePrompts.slice(3, 6).map((prompt, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full text-left justify-start text-xs h-auto p-2"
                      onClick={() => handleSamplePrompt(prompt)}
                      disabled={isGenerating}
                    >
                      <Eye className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{prompt}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Generation Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>• Be specific about actions and movements</p>
                  <p>• Use &quot;Ultra Fast&quot; for quick previews</p>
                  <p>• Describe lighting and mood</p>
                  <p>• Keep prompts under 100 words</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </FormProvider>

        {/* Enhanced Progress Display */}
        {
          isGenerating && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Queue Status */}
                  {isQueued && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>Position in queue: #{queuePosition}</span>
                      {estimatedWaitTime && (
                        <Badge variant="secondary">
                          ~{Math.round(estimatedWaitTime / 60)}min wait
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {isQueued ? "Waiting in queue..." : "Generating your video..."}
                      </span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(timeElapsed)}</span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>

                  {/* Fun Facts */}
                  {!isQueued && (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        {funFacts[currentFunFact]}
                      </p>
                    </div>
                  )}

                  {/* Prediction ID */}
                  {predictionId && (
                    <p className="text-xs text-muted-foreground text-center">
                      ID: {predictionId.substring(0, 20)}...
                    </p>
                  )}

                  {/* Estimated time remaining */}
                  {estimatedWaitTime && !isQueued && (
                    <div className="text-center">
                      <Badge variant="outline">
                        ~{Math.max(0, Math.round((estimatedWaitTime - timeElapsed) / 60))}min remaining
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        }

        {/* Cached Result Notice */}
        {
          cachedResult && (
            <Alert className="mt-6">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Great news! We found a cached version of this video, so it was delivered instantly!
              </AlertDescription>
            </Alert>
          )
        }

        {/* Error Display */}
        {
          error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )
        }

        {/* Video Result */}
        <div className="mt-6">
          {!video && !isGenerating && !error && (
            <Empty label="Ready to create amazing videos! Enter a prompt above to get started." />
          )}

          {video && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <VideoIcon className="w-5 h-5" />
                  Your Generated Video
                  {cachedResult && <Badge variant="secondary">Cached</Badge>}
                </CardTitle>
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
                  autoPlay
                  muted
                  loop
                >
                  <source src={video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {metadata && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {metadata.resolution && (
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{metadata.resolution}</span>
                      </div>
                    )}
                    {metadata.fps && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>{metadata.fps} FPS</span>
                      </div>
                    )}
                    {metadata.format && (
                      <div className="flex items-center gap-2">
                        <VideoIcon className="w-4 h-4" />
                        <span>{metadata.format.toUpperCase()}</span>
                      </div>
                    )}
                    {generationStartTime && (
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        <span>{Math.round((Date.now() - generationStartTime) / 1000)}s</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div >
    </div >
  );
};

export default VideoPage;