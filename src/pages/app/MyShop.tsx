import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Mail, Save, Store, Package, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  location: string | null;
  contact_info: string | null;
}

const MyShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    contact_info: "",
  });

  useEffect(() => {
    if (user) {
      loadShop();
    }
  }, [user]);

  const loadShop = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setShop(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          location: data.location || "",
          contact_info: data.contact_info || "",
        });
        setBannerPreview(data.banner_url);
      }
    } catch (error: any) {
      console.error('Error loading shop:', error);
      toast({
        title: "Error",
        description: "Failed to load shop",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!user || !shop) return;

    setIsUploadingBanner(true);
    try {
      // Delete old banner if it exists
      if (shop.banner_url) {
        const oldFileName = shop.banner_url.split('/').pop()?.split('?')[0];
        if (oldFileName) {
          await supabase.storage
            .from('shop-banners')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      // Upload new banner
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${shop.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shop-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shop-banners')
        .getPublicUrl(fileName);

      // Update shop with new banner URL
      const { error: updateError } = await supabase
        .from('shops')
        .update({ banner_url: publicUrl })
        .eq('id', shop.id);

      if (updateError) throw updateError;

      setBannerPreview(publicUrl);
      setBannerFile(null);
      loadShop(); // Reload to get updated shop data

      toast({
        title: "Banner Updated!",
        description: "Your shop banner has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload banner image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBanner = async () => {
    if (!user || !shop || !shop.banner_url) return;

    try {
      // Delete from storage
      const fileName = shop.banner_url.split('/').pop()?.split('?')[0];
      if (fileName) {
        await supabase.storage
          .from('shop-banners')
          .remove([`${user.id}/${fileName}`]);
      }

      // Update shop to remove banner URL
      const { error } = await supabase
        .from('shops')
        .update({ banner_url: null })
        .eq('id', shop.id);

      if (error) throw error;

      setBannerPreview(null);
      setBannerFile(null);
      loadShop();

      toast({
        title: "Banner Removed",
        description: "Your shop banner has been removed.",
      });
    } catch (error: any) {
      console.error('Error removing banner:', error);
      toast({
        title: "Error",
        description: "Failed to remove banner",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      if (shop) {
        // Update existing shop
        const { error } = await supabase
          .from('shops')
          .update({
            name: formData.name,
            description: formData.description || null,
            location: formData.location || null,
            contact_info: formData.contact_info || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shop.id);

        if (error) throw error;

        toast({
          title: "Shop Updated!",
          description: "Your shop information has been updated successfully.",
        });
        loadShop();
      } else {
        // Create new shop
        const { data, error } = await supabase
          .from('shops')
          .insert({
            owner_id: user.id,
            name: formData.name,
            description: formData.description || null,
            location: formData.location || null,
            contact_info: formData.contact_info || null,
            banner_url: bannerPreview || null,
          })
          .select()
          .single();

        if (error) throw error;

        setShop(data);
        toast({
          title: "Shop Created!",
          description: "Your shop has been created successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error saving shop:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save shop",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Shop</h1>
        <p className="text-muted-foreground">Manage your shop information and settings</p>
      </div>

      {/* Shop Info Card */}
      {shop && (
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{shop.name}</h2>
                  <p className="text-sm text-muted-foreground">Shop ID: {shop.id.substring(0, 8)}...</p>
                </div>
              </div>
              <Link to={`/app/shop/${shop.id}`}>
                <Button variant="outline">View Shop</Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Share your shop link: <code className="bg-muted px-2 py-1 rounded">{window.location.origin}/app/shop/{shop.id}</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payments shortcut */}
      {shop && (
        <Card variant="glass">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Manual Payments</h2>
              <p className="text-sm text-muted-foreground">
                Review and verify payment screenshots submitted by your buyers.
              </p>
            </div>
            <Link to="/app/payments">
              <Button variant="hero">Open Payments</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Banner Upload */}
      {shop && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Shop Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full bg-gradient-to-br from-primary/20 to-emerald/20 rounded-xl overflow-hidden border-2 border-dashed border-border">
              {bannerPreview ? (
                <>
                  <img
                    src={bannerPreview}
                    alt="Shop banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingBanner}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Banner
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveBanner}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-2">No banner uploaded</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingBanner}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banner
                  </Button>
                </div>
              )}
              {isUploadingBanner && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Uploading...</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {bannerFile && !isUploadingBanner && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{bannerFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(bannerFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBannerFile(null);
                      if (shop?.banner_url) {
                        setBannerPreview(shop.banner_url);
                      } else {
                        setBannerPreview(null);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    size="sm"
                    onClick={() => handleBannerUpload(bannerFile)}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Recommended size: 1200x400px. Maximum file size: 5MB. Formats: JPG, PNG, WEBP
            </p>
          </CardContent>
        </Card>
      )}

      {/* Shop Form */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>{shop ? "Edit Shop Information" : "Create Your Shop"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  placeholder="e.g., Green Farm Shop"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell customers about your shop..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="pl-10"
                  placeholder="e.g., Kapatagan, Lanao Del Norte"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_info">Contact Information</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="pl-10"
                  placeholder="e.g., +63 912 345 6789 or email@example.com"
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products Management Link */}
      {shop && (
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Manage Products</h3>
                  <p className="text-sm text-muted-foreground">Add and manage products in your shop</p>
                </div>
              </div>
              <Link to="/app/marketplace">
                <Button variant="outline">Go to Marketplace</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyShop;

