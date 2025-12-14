import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockDiagnosis } from "@/lib/mockData";
import { Upload, Camera, CheckCircle, AlertTriangle, Leaf, Pill, Shield } from "lucide-react";
import { useState, useRef } from "react";

const CropDoctor = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Crop Doctor</h1>
        <p className="text-muted-foreground">AI-powered crop disease diagnosis and treatment recommendations</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-accent/10 rounded-xl">
                      <div>
                        <p className="text-sm text-muted-foreground">Detected Disease</p>
                        <p className="text-xl font-bold text-accent">{mockDiagnosis.disease}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-xl font-bold text-primary">{mockDiagnosis.confidence}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm text-muted-foreground">Severity</p>
                        <p className="font-semibold">{mockDiagnosis.severity}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm text-muted-foreground">Affected Area</p>
                        <p className="font-semibold">{mockDiagnosis.affectedArea}</p>
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
                    {mockDiagnosis.treatments.map((treatment, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{treatment}</span>
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
                    {mockDiagnosis.prevention.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-emerald/5 rounded-xl">
                        <Leaf className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
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
    </div>
  );
};

export default CropDoctor;
