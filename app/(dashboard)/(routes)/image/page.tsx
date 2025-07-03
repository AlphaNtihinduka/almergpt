/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Heading from "@/components/heading";
import {
  Download,
  ImageIcon,
  Trash2,
  Copy,
  Share2,
  Eye,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Heart,
  MoreHorizontal
} from "lucide-react";
import Image from "next/image";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { amountOptions, formSchema, resolutionOptions } from "./constants";
import { FormField, FormControl, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios, { AxiosError } from "axios";
import { useState, useCallback, useMemo, useRef } from "react";
import Empty from "@/components/empty";
import Loader from "@/components/loader";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem
} from "@/components/ui/select";
import { Card, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HistoryModal } from "@/components/HistoryModal";
import ImageGenerationHistory from "@/components/ImageGenerationHistory";

// Enhanced types
interface GeneratedImage {
  id: string;
  url: string;
  revised_prompt?: string;
  original_prompt: string;
  resolution: string;
  created_at: Date;
  is_favorite?: boolean;
}

interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

const ImagePage = () => {
  // State management
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Refs
  const formRef = useRef<HTMLFormElement>(null);

  // Form setup with enhanced validation
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      amount: "1",
      resolution: "1024x1024",
    },
    mode: "onChange" // Real-time validation
  });

  const isLoading = formMethods.formState.isSubmitting;
  const promptValue = formMethods.watch("prompt");

  // Memoized values
  const estimatedTokens = useMemo(() => {
    return Math.ceil(promptValue.length / 4); // Rough token estimation
  }, [promptValue]);

  const canGenerate = useMemo(() => {
    return promptValue.trim().length >= 3 && !isLoading;
  }, [promptValue, isLoading]);

  // Enhanced error handling
  const handleApiError = useCallback((error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.status === 429) {
        return "Rate limit exceeded. Please wait a moment before trying again.";
      }

      if (axiosError.response?.status === 402) {
        return "Insufficient credits. Please check your account balance.";
      }

      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }

      return axiosError.message || "Network error occurred";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred";
  }, []);

  // Progress simulation for better UX
  const simulateProgress = useCallback(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Enhanced submission with retry logic
  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null);
      setImages([]);

      const cleanup = simulateProgress();

      const response = await axios.post("/api/image", values, {
        timeout: 60000, // 60 second timeout
      });

      cleanup();
      setProgress(100);

      const newImages: GeneratedImage[] = response.data.images.map((img: Pick<GeneratedImage, 'url' | 'revised_prompt'>, index: number) => ({
        id: `${Date.now()}-${index}`,
        url: img.url,
        revised_prompt: img.revised_prompt,
        original_prompt: values.prompt,
        resolution: values.resolution,
        created_at: new Date(),
        is_favorite: false
      }));

      setImages(newImages);
      setRetryCount(0);

      toast("Images generated successfully!");

      // Reset form after successful generation
      formMethods.reset({
        prompt: "",
        amount: values.amount,
        resolution: values.resolution,
      });

    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      setProgress(0);

      toast.error(`Generation failed: ${errorMessage}`);
    }
  }, [handleApiError, simulateProgress, formMethods]);

  // Retry mechanism
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      formMethods.handleSubmit(onSubmit)();
    }
  }, [retryCount, formMethods, onSubmit]);

  // Image actions
  const downloadImage = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast("Download started!");
    } catch {
      toast.error("Download failed: Could not download the image");
    }
  }, []);

  const copyPrompt = useCallback((prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast("Copied to clipboard. Prompt has been copied");
  }, []);

  const toggleFavorite = useCallback((imageId: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId
        ? { ...img, is_favorite: !img.is_favorite }
        : img
    ));
  }, []);

  const deleteImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    toast("Image deleted successfully");
  }, []);

  const shareImage = useCallback((image: GeneratedImage) => {
    if (navigator.share) {
      navigator.share({
        title: 'Generated Image',
        text: image.original_prompt,
        url: image.url,
      });
    } else {
      navigator.clipboard.writeText(image.url);
      toast("Image URL copied to clipboard. You can share it manually.");
    }
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canGenerate) {
        formMethods.handleSubmit(onSubmit)();
      }
    }
  }, [canGenerate, formMethods, onSubmit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between w-full mb-4">
        <Heading
          title="AI Image Generator"
          description="Create stunning images with advanced AI technology"
          icon={ImageIcon}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsHistoryOpen(true)
          }
          className="gap-2 mr-8"
        >
          Recent search
        </Button>
      </div>
      <div className="px-4 lg:px-8">
        <FormProvider {...formMethods}>
          <form
            ref={formRef}
            onSubmit={formMethods.handleSubmit(onSubmit)}
            onKeyDown={handleKeyDown}
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm space-y-4"
          >
            {/* Main prompt input */}
            <div className="space-y-2">
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the image you want to generate... (e.g., 'A majestic mountain landscape at sunset with golden clouds')"
                        disabled={isLoading}
                        className="min-h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Prompt stats */}
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{promptValue.length} characters</span>
                <span>~{estimatedTokens} tokens</span>
              </div>
            </div>

            {/* Controls grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={formMethods.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Amount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {amountOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={formMethods.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Resolution" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resolutionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={!canGenerate}
                className="md:col-span-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Images
                  </>
                )}
              </Button>
            </div>
            <HistoryModal
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              title="Recent Searches"
            >
              <ImageGenerationHistory />
            </HistoryModal>

            {/* Keyboard shortcut hint */}
            <div className="text-xs text-muted-foreground text-center">
              Press Cmd/Ctrl + Enter to generate
            </div>
          </form>
        </FormProvider>

        {/* Progress bar */}
        {isLoading && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Generating your images... This may take up to 30 seconds
            </p>
          </div>
        )}

        {/* Error handling with retry */}
        {error && (
          <div className="mt-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Generation Failed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            {retryCount < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry ({3 - retryCount} attempts left)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results section */}
      <div className="px-4 lg:px-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader />
            <p className="mt-4 text-muted-foreground">Creating your masterpiece...</p>
          </div>
        )}

        {images.length === 0 && !isLoading && (
          <Empty label="No images generated yet. Enter a prompt above to get started!" />
        )}

        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Images ({images.length})</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImages([])}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <Card key={image.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      alt={image.original_prompt}
                      fill
                      src={image.url}
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedImage(image)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Image Preview</DialogTitle>
                          </DialogHeader>
                          <div className="relative aspect-square max-h-[70vh]">
                            <Image
                              alt={image.original_prompt}
                              fill
                              src={image.url}
                              className="object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => downloadImage(image)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleFavorite(image.id)}
                      >
                        <Heart className={`w-4 h-4 ${image.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>

                    {/* Resolution badge */}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-xs"
                    >
                      {image.resolution}
                    </Badge>

                    {/* Favorite indicator */}
                    {image.is_favorite && (
                      <Heart className="absolute top-2 right-2 w-4 h-4 fill-red-500 text-red-500" />
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {image.revised_prompt || image.original_prompt}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {image.created_at.toLocaleTimeString()}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadImage(image)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyPrompt(image.original_prompt)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Prompt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareImage(image)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteImage(image.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default ImagePage;