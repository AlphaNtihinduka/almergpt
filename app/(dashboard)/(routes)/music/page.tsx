"use client";

import Heading from "@/components/heading";
import { MusicIcon, AlertCircle, Clock } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import axios, { AxiosError } from "axios";
import { useState, useCallback, useRef, useEffect } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";

// Enhanced form schema with validation
const formSchema = z.object({
  prompt: z.string()
    .min(1, "Please enter a music prompt")
    .max(500, "Prompt must be less than 500 characters")
    .regex(/^[a-zA-Z0-9\s\-.,!?'"()]+$/, "Prompt contains invalid characters")
});

// Error types for better error handling
interface ApiError {
  error: string;
  code?: string;
  resetTime?: string;
}

interface GenerationResult {
  audio: string;
  metadata?: {
    prompt: string;
    processingTime: number;
    timestamp: string;
  };
}

const MusicPage = () => {
  const [music, setMusic] = useState<string>();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rateLimitReset, setRateLimitReset] = useState<Date | null>(null);
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: "" },
    mode: "onChange" // Real-time validation
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Progress simulation during generation
  const startProgressSimulation = useCallback(() => {
    setProgress(0);
    let currentProgress = 0;

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 5;
      if (currentProgress >= 95) {
        currentProgress = 95; // Don't reach 100% until actually done
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      setProgress(currentProgress);
    }, 500);
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(100);
    setTimeout(() => setProgress(0), 1000);
  }, []);

  // Enhanced error handling
  const handleApiError = useCallback((error: AxiosError<ApiError>) => {
    if (error.response?.data) {
      const { error: message, code, resetTime } = error.response.data;

      switch (code) {
        case "RATE_LIMIT_EXCEEDED":
          if (resetTime) {
            setRateLimitReset(new Date(resetTime));
          }
          setError("You've reached the generation limit. Please wait before trying again.");
          break;
        case "INAPPROPRIATE_CONTENT":
          setError("Your prompt violates our content policy. Please try a different prompt.");
          break;
        case "TIMEOUT":
          setError("Generation timed out. Please try again with a simpler prompt.");
          break;
        case "FILE_TOO_LARGE":
          setError("The generated audio file is too large. Try a shorter prompt.");
          break;
        case "VALIDATION_ERROR":
          setError(message);
          break;
        default:
          setError("Something went wrong. Please try again.");
      }
    } else if (error.code === "ECONNABORTED") {
      setError("Request was cancelled or timed out.");
    } else {
      setError("Network error. Please check your connection and try again.");
    }
  }, []);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      // Reset state
      setMusic(undefined);
      setError(undefined);
      setIsGenerating(true);
      setRateLimitReset(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Start progress simulation
      startProgressSimulation();

      console.log("Starting music generation:", values.prompt);

      const response = await axios.post<GenerationResult>(
        "/api/music",
        values,
        {
          timeout: 150000, // 2.5 minutes client timeout
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const { audio, metadata } = response.data;

      if (!audio) {
        throw new Error("No audio data received");
      }

      setMusic(audio);

      // Add to history (keep last 5)
      setGenerationHistory(prev => [audio, ...prev.slice(0, 4)]);

      console.log("Music generation successful:", {
        prompt: values.prompt,
        processingTime: metadata?.processingTime,
        audioLength: typeof audio === 'string' ? audio.length : 'URL'
      });

    } catch (error: unknown) {
      console.error("Music generation error:", error);

      if (axios.isAxiosError(error)) {
        handleApiError(error);
      } else if (error instanceof Error && error.name === 'AbortError') {
        setError("Generation was cancelled.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      stopProgressSimulation();
    }
  }, [startProgressSimulation, stopProgressSimulation, handleApiError]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Clear error when user starts typing
  const handlePromptChange = useCallback((value: string) => {
    if (error) {
      setError(undefined);
    }
    return value;
  }, [error]);

  // Rate limit countdown
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);

  useEffect(() => {
    if (rateLimitReset) {
      const interval = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, rateLimitReset.getTime() - now.getTime());
        setTimeUntilReset(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          setRateLimitReset(null);
          setTimeUntilReset(0);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [rateLimitReset]);

  const isSubmitDisabled = isGenerating || !!rateLimitReset || !formMethods.formState.isValid;

  return (
    <div>
      <Heading
        title="Music Generation"
        description="Generate amazing music using AI based on your creative prompts"
        icon={MusicIcon}
        iconColor="text-violet-500"
        bgColor="bg-violet-500/10"
      />

      <div className="px-4 lg:px-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Rate Limit Alert */}
        {rateLimitReset && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Rate limit reached. Try again in {Math.floor(timeUntilReset / 60)}:
              {(timeUntilReset % 60).toString().padStart(2, '0')}
            </AlertDescription>
          </Alert>
        )}

        <FormProvider {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(onSubmit)}
            className="relative rounded-xl border border-gray-200/60 w-full p-6 md:p-8 bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300/50 grid grid-cols-12 gap-4 md:gap-6"
          >
            {/* Subtle background decoration */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none" />

            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10 relative z-10">
                  <FormControl className="m-0 p-0">
                    <div className="relative group">
                      <Input
                        placeholder="Describe the music you want to generate... (e.g., 'upbeat jazz with saxophone')"
                        disabled={isGenerating}
                        {...field}
                        onChange={(e) => {
                          const value = handlePromptChange(e.target.value);
                          field.onChange(value);
                        }}
                        maxLength={500}
                        className="h-12 md:h-14 text-base md:text-lg px-4 md:px-6 rounded-lg border-2 border-gray-200/80 bg-white/90 backdrop-blur-sm placeholder:text-gray-400 transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 focus:bg-white disabled:bg-gray-50/80 disabled:text-gray-500 shadow-sm hover:shadow-md focus:shadow-lg"
                      />

                      {/* Character count indicator */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                        {field.value?.length || 0}/500
                      </div>

                      {/* Subtle glow effect when focused */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-sm mt-2 text-red-500" />
                </FormItem>
              )}
            />

            <div className="col-span-12 lg:col-span-2 flex gap-3 relative z-10">
              <Button
                type="submit"
                className="flex-1 h-12 md:h-14 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:transform-none disabled:shadow-sm focus:ring-4 focus:ring-blue-200 relative overflow-hidden"
                disabled={isSubmitDisabled}
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      Generate
                    </>
                  )}
                </span>
              </Button>

              {isGenerating && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelGeneration}
                  className="h-12 md:h-14 px-4 border-2 border-gray-300 hover:border-red-400 bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>

            {/* Subtle bottom accent line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent rounded-full" />
          </form>
        </FormProvider>

        {/* Character Count */}
        <div className="text-sm text-muted-foreground mt-2 text-right">
          {formMethods.watch("prompt")?.length || 0}/500 characters
        </div>

        {/* Progress Bar */}
        {isGenerating && progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Generating your music...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </div>

      <div className="space-y-4 mt-4 px-4 lg:px-8">
        {/* Loading State */}
        {isGenerating && (
          <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
            <div className="text-center">
              <Loader />
              <p className="mt-2 text-sm text-muted-foreground">
                This usually takes 30-60 seconds...
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!music && !isGenerating && !error && (
          <Empty label="No music generated yet. Enter a prompt above to get started!" />
        )}

        {/* Current Generation */}
        {music && (
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold mb-2">Generated Music</h3>
            <audio controls className="w-full" preload="metadata">
              <source src={music} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = music;
                  link.download = `generated-music-${Date.now()}.mp3`;
                  link.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Generation History */}
        {generationHistory.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Recent Generations</h3>
            <div className="space-y-2">
              {generationHistory.slice(1).map((audio, index) => (
                <div key={index} className="bg-white rounded p-2">
                  <audio controls className="w-full" preload="none">
                    <source src={audio} type="audio/mp3" />
                  </audio>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPage;