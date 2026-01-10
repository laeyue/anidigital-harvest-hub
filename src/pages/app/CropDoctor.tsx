"use client";

import { GetServerSideProps } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, CheckCircle, AlertTriangle, Leaf, Pill, Shield, History, Clock } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  identifyCropDisease,
  getIdentificationResult,
  sendFeedback,
  isApiConfigured as isPlantIdConfigured,
} from "@/lib/plantIdApi";
import { formatDistanceToNow } from "date-fns";

interface Diagnosis {
  disease: string;
  confidence: number;
  severity: string;
  affected_area: string;
  treatments: string[];
  prevention_tips: string[];
}

interface DiagnosisHistory {
  id: string;
  image_url: string;
  disease: string;
  confidence: number;
  severity: string;
  affected_area: string;
  treatments: string[];
  prevention_tips: string[];
  created_at: string;
}

const CropDoctor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadDiagnosisHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('crop_diagnoses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading diagnosis history:', error);
        return;
      }

      setDiagnosisHistory(data || []);
    } catch (error) {
      logger.error('Error loading diagnosis history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDiagnosisHistory();
    }
  }, [user, loadDiagnosisHistory]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      await analyzeImage(file);
    }
  };

  const analyzeImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to analyze images",
        variant: "destructive",
      });
      return;
    }

    if (!isPlantIdConfigured()) {
      toast({
        title: "Configuration required",
        description: "Plant.id API key is not configured. Please add NEXT_PUBLIC_PLANT_ID_API_KEY to your .env file.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);

    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crop-images')
        .getPublicUrl(fileName);


      // Call Plant.id API to identify crop disease
      const { access_token } = await identifyCropDisease(file);
      setAccessToken(access_token);

      // Fetch detailed result with disease info
      const result = await getIdentificationResult(access_token, [
        "treatment",
        "symptoms",
        "severity",
        "description",
        "common_names",
      ]) as {
        result?: {
          disease?: {
            suggestions?: Array<{
              name: string;
              scientific_name?: string;
              probability: number;
              details?: {
                treatment?: unknown;
                symptoms?: unknown;
                severity?: unknown;
                description?: unknown;
                common_names?: unknown;
              };
            }>;
          };
        };
      };

      const diseaseSuggestions =
        result?.result?.disease?.suggestions && Array.isArray(result.result.disease.suggestions)
          ? result.result.disease.suggestions
          : [];

      if (!diseaseSuggestions.length) {
        setDiagnosis({
          disease: "No disease detected",
          confidence: 0,
          severity: "Unknown",
          affected_area: "Unknown",
          treatments: ["No specific treatment recommended. The crop appears healthy or unclear."],
          prevention_tips: [
            "Monitor the crop regularly for any signs of disease.",
            "Ensure proper spacing, watering, and nutrition.",
          ],
        });
        setIsAnalyzing(false);
        setShowResults(true);
        return;
      }

      const top = diseaseSuggestions[0];
      const details = (top.details || {}) as {
        treatment?: unknown;
        symptoms?: unknown;
        severity?: string | unknown;
        description?: unknown;
        common_names?: unknown;
      };
      const probability = typeof top.probability === "number" ? top.probability * 100 : 0;

      const treatmentDetails = (details.treatment || {}) as {
        biological?: unknown;
        chemical?: unknown;
        prevention?: unknown;
      };
      const treatments: string[] = [];
      const preventionTips: string[] = [];

      const pushFrom = (source: unknown, target: string[]) => {
        if (!source) return;
        if (Array.isArray(source)) {
          source.forEach((item) => {
            if (typeof item === "string") target.push(item);
          });
        } else if (typeof source === "string") {
          target.push(source);
        }
      };

      pushFrom(treatmentDetails.biological, treatments);
      pushFrom(treatmentDetails.chemical, treatments);
      pushFrom(treatmentDetails.prevention, treatments);

      pushFrom(treatmentDetails.prevention, preventionTips);

      const mappedDiagnosis: Diagnosis = {
        disease: top.name || top.scientific_name || "Unknown disease",
        confidence: Number(probability.toFixed(2)),
        severity: (typeof details.severity === 'string' ? details.severity : "Unknown"),
        affected_area: "Leaves",
        treatments:
          treatments.length > 0
            ? treatments
            : ["Follow general best practices: remove affected parts and improve growing conditions."],
        prevention_tips:
          preventionTips.length > 0
            ? preventionTips
            : [
                "Rotate crops regularly to prevent disease build-up.",
                "Use disease-resistant varieties when available.",
              ],
      };

      // Save diagnosis to database
      const { error: dbError } = await supabase.from("crop_diagnoses").insert({
        user_id: user.id,
        image_url: publicUrl,
        disease: mappedDiagnosis.disease,
        confidence: mappedDiagnosis.confidence,
        severity: mappedDiagnosis.severity,
        affected_area: mappedDiagnosis.affected_area,
        treatments: mappedDiagnosis.treatments,
        prevention_tips: mappedDiagnosis.prevention_tips,
      });

      if (dbError) {
        logger.error("Error saving diagnosis:", dbError);
      }

      setDiagnosis(mappedDiagnosis);
      setIsAnalyzing(false);
      setShowResults(true);
      
      // Reload history to include the new diagnosis
      loadDiagnosisHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze image. Please try again.";
      setIsAnalyzing(false);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      await analyzeImage(file);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setShowResults(false);
    setDiagnosis(null);
    setAccessToken(null);
    setFeedbackRating(null);
    setFeedbackComment("");
  };

  const handleSubmitFeedback = async () => {
    if (!accessToken) {
      toast({
        title: "Feedback unavailable",
        description: "No diagnosis reference found for feedback.",
        variant: "destructive",
      });
      return;
    }
    if (!feedbackRating) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      await sendFeedback(accessToken, feedbackRating, feedbackComment);
      toast({
        title: "Thank you!",
        description: "Your feedback was submitted to improve future diagnoses.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not submit feedback. Please try again later.";
      toast({
        title: "Feedback failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Crop Doctor</h1>
        <p className="text-muted-foreground">AI-powered crop disease diagnosis and treatment recommendations</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upload Area */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Crop Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!uploadedImage ? (
              <div
                className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Drop your image here</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  or click to browse from your device
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG up to 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Uploaded crop"
                    className="w-full h-64 object-cover"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-medium">Analyzing your crop...</p>
                        <p className="text-sm text-white/70">This may take a few seconds</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={resetUpload}>
                  Upload Different Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Area */}
        <div className="space-y-6">
          {showResults ? (
            <>
              {/* Diagnosis Result */}
              <Card variant="gradient">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent" />
                    Diagnosis Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-accent/10 rounded-xl">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Detected Disease</p>
                        <p className="text-lg sm:text-xl font-bold text-accent break-words">{diagnosis?.disease}</p>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Confidence</p>
                        <p className="text-lg sm:text-xl font-bold text-primary">{diagnosis?.confidence}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Severity</p>
                        <p className="text-sm sm:text-base font-semibold break-words">{diagnosis?.severity}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">Affected Area</p>
                        <p className="text-sm sm:text-base font-semibold break-words">{diagnosis?.affected_area}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Recommendations */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-primary" />
                    Treatment Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {diagnosis?.treatments.map((treatment, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed break-words">{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Prevention Tips */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald" />
                    Prevention Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {diagnosis?.prevention_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-emerald/5 rounded-xl">
                        <Leaf className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed break-words">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Feedback */}
              {accessToken && (
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Was this diagnosis helpful?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm ${
                              feedbackRating && feedbackRating >= star
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border"
                            }`}
                          >
                            {star}
                          </button>
                        ))}
                        {feedbackRating && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {feedbackRating} / 5
                          </span>
                        )}
                      </div>
                      <textarea
                        className="w-full min-h-[80px] text-sm rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Optional: add a short comment about the diagnosis accuracy..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                      />
                      <Button
                        variant="hero"
                        className="w-full"
                        onClick={handleSubmitFeedback}
                        disabled={submittingFeedback}
                      >
                        {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card variant="glass" className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Upload an image of your crop to get AI-powered diagnosis and treatment recommendations.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Diagnosis History */}
      {diagnosisHistory.length > 0 && (
        <Card variant="glass">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              Past Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {isLoadingHistory ? (
              <div className="text-center py-6 sm:py-8">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Loading history...</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {diagnosisHistory.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border-border">
                    <AccordionTrigger className="hover:no-underline px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 text-left">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt="Crop diagnosis"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <p className="font-semibold text-sm sm:text-base truncate">{item.disease}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium self-start sm:self-auto">
                              {item.confidence}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 sm:px-4">
                      <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                        <div className="relative rounded-xl overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt="Crop diagnosis"
                            className="w-full h-48 sm:h-64 object-cover"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Severity</p>
                            <p className="text-sm sm:text-base font-semibold break-words">{item.severity}</p>
                          </div>
                          <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Affected Area</p>
                            <p className="text-sm sm:text-base font-semibold break-words">{item.affected_area}</p>
                          </div>
                        </div>

                        {item.treatments && item.treatments.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base mb-2 flex items-center gap-2">
                              <Pill className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Treatment Recommendations</span>
                            </h4>
                            <ul className="space-y-2">
                              {item.treatments.map((treatment, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 sm:p-3 bg-primary/5 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  <span className="text-xs sm:text-sm leading-relaxed break-words">{treatment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.prevention_tips && item.prevention_tips.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-emerald flex-shrink-0" />
                              <span>Prevention Tips</span>
                            </h4>
                            <ul className="space-y-2">
                              {item.prevention_tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 sm:p-3 bg-emerald/5 rounded-lg">
                                  <Leaf className="w-4 h-4 text-emerald flex-shrink-0 mt-0.5" />
                                  <span className="text-xs sm:text-sm leading-relaxed break-words">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CropDoctor;

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

