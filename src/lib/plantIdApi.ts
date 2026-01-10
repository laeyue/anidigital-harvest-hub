const PLANT_ID_API_BASE = "https://crop.kindwise.com/api/v1";

// Get Plant.id API key from environment variable
// Add NEXT_PUBLIC_PLANT_ID_API_KEY to your .env file
const getApiKey = () => {
  if (typeof window === 'undefined') return ''; // Server-side
  return process.env.NEXT_PUBLIC_PLANT_ID_API_KEY || "";
};

export const isApiConfigured = () => {
  return !!getApiKey();
};

interface IdentifyOptions {
  latitude?: number;
  longitude?: number;
  similar_images?: boolean;
  custom_id?: number;
  datetime?: string;
}

// Create a new identification and return its access_token
export const identifyCropDisease = async (
  imageFile: File,
  options: IdentifyOptions = {}
): Promise<{ access_token: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Plant.id API key is not configured");
  }

  const formData = new FormData();
  formData.append("images", imageFile);

  if (typeof options.latitude === "number") {
    formData.append("latitude", String(options.latitude));
  }
  if (typeof options.longitude === "number") {
    formData.append("longitude", String(options.longitude));
  }
  if (typeof options.similar_images === "boolean") {
    formData.append("similar_images", String(options.similar_images));
  }
  if (typeof options.custom_id === "number") {
    formData.append("custom_id", String(options.custom_id));
  }
  if (options.datetime) {
    formData.append("datetime", options.datetime);
  }

  const response = await fetch(`${PLANT_ID_API_BASE}/identification`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plant.id identification failed: ${response.status} ${text}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Plant.id response did not include access_token");
  }

  return { access_token: data.access_token as string };
};

// Fetch detailed identification result for a given access_token
export const getIdentificationResult = async (
  accessToken: string,
  details: string[] = []
): Promise<unknown> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Plant.id API key is not configured");
  }

  const params = new URLSearchParams();
  if (details.length > 0) {
    params.set("details", details.join(","));
  }
  params.set("language", "en");

  const response = await fetch(
    `${PLANT_ID_API_BASE}/identification/${encodeURIComponent(accessToken)}?${params.toString()}`,
    {
      headers: {
        "Api-Key": apiKey,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plant.id result fetch failed: ${response.status} ${text}`);
  }

  return response.json();
};

// Send user feedback for a given identification
export const sendFeedback = async (
  accessToken: string,
  rating: number,
  comment?: string
): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Plant.id API key is not configured");
  }

  const body: { rating: number; comment?: string } = { rating };
  if (comment && comment.trim()) {
    body.comment = comment.trim();
  }

  const response = await fetch(
    `${PLANT_ID_API_BASE}/identification/${encodeURIComponent(accessToken)}/feedback`,
    {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plant.id feedback failed: ${response.status} ${text}`);
  }
};

// Optional: get API key usage information
export const getUsageInfo = async (): Promise<unknown> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Plant.id API key is not configured");
  }

  const response = await fetch(`${PLANT_ID_API_BASE}/usage_info`, {
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plant.id usage info failed: ${response.status} ${text}`);
  }

  return response.json();
};





