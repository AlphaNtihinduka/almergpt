import * as z from "zod";

// Amount options (1-5 images)
export const amountOptions = [
  { value: "1", label: "1 Image" },
  { value: "2", label: "2 Images" },
  { value: "3", label: "3 Images" },
  { value: "4", label: "4 Images" },
  { value: "5", label: "5 Images" },
];

// Resolution options for OpenAI DALL-E
export const resolutionOptions = [
  { value: "1024x1792", label: "1024x1792" },
  { value: "1792x1024", label: "1792x1024" },
  { value: "1024x1024", label: "1024x1024" },
];

// Form validation schema
export const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt too long"),
  amount: z.string().refine(
    (val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 5;
    },
    { message: "Amount must be between 1 and 5" }
  ),
  resolution: z.enum(["1024x1792", "1792x1024", "1024x1024"], {
    errorMap: () => ({ message: "Please select a valid resolution" }),
  }),
});