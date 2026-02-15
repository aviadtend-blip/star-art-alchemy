// Image generation API client - placeholder
// Will call backend edge function for actual generation

export interface GenerationResult {
  imageUrl: string;
  prompt: string;
  status: "pending" | "generating" | "complete" | "error";
}

export async function generateArtwork(prompt: string): Promise<GenerationResult> {
  console.log("Generating artwork with prompt:", prompt.substring(0, 100) + "...");

  // TODO: Replace with actual API call via edge function
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        imageUrl: "", // Will be populated by actual generation
        prompt,
        status: "complete",
      });
    }, 2000);
  });
}
