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
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      placeholder="Describe the music you want to generate... (e.g., 'upbeat jazz with saxophone')"
                      disabled={isGenerating}
                      {...field}
                      onChange={(e) => {
                        const value = handlePromptChange(e.target.value);
                        field.onChange(value);
                      }}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="col-span-12 lg:col-span-2 flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitDisabled}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
              
              {isGenerating && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelGeneration}
                >
                  Cancel
                </Button>
              )}
            </div>
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