import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, MapPin, Ruler, Leaf, Save, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { createPolygon, deletePolygon, isApiConfigured } from "@/lib/agromonitoring";

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    farmSize: "",
    crops: "",
    bio: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [originalLocation, setOriginalLocation] = useState<string>("");
  const [oldPolygonId, setOldPolygonId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoadingProfile(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // If profile doesn't exist, create one
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('0 rows')) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
            email: user.email || "",
            role: user.user_metadata?.role || "farmer",
            location: user.user_metadata?.location || "",
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          toast({
            title: "Error",
            description: createError.message || "Failed to create profile",
            variant: "destructive",
          });
          // Set default values from auth user
          setFormData({
            name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
            email: user.email || "",
            location: user.user_metadata?.location || "",
            farmSize: "",
            crops: "",
            bio: "",
          });
        } else if (newProfile) {
          const location = newProfile.location || "";
          setFormData({
            name: newProfile.name || "",
            email: newProfile.email || user.email || "",
            location: location,
            farmSize: newProfile.farm_size || "",
            crops: newProfile.crops_planted?.join(", ") || "",
            bio: newProfile.bio || "",
          });
          setOriginalLocation(location);
          setOldPolygonId(newProfile.polygon_id || null);
          setAvatarUrl(newProfile.avatar_url);
        }
      } else {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive",
        });
        // Set default values from auth user as fallback
        setFormData({
          name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
          email: user.email || "",
          location: "",
          farmSize: "",
          crops: "",
          bio: "",
        });
      }
    } else if (data) {
      const location = data.location || "";
      setFormData({
        name: data.name || "",
        email: data.email || user.email || "",
        location: location,
        farmSize: data.farm_size || "",
        crops: data.crops_planted?.join(", ") || "",
        bio: data.bio || "",
      });
      setOriginalLocation(location); // Store original location to detect changes
      setOldPolygonId(data.polygon_id || null); // Store old polygon_id for cache clearing
      setAvatarUrl(data.avatar_url);
    }
    setIsLoadingProfile(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const cropsArray = formData.crops.split(',').map(c => c.trim()).filter(c => c);
    const locationChanged = formData.location !== originalLocation && formData.location.trim() !== "";

    // If location changed and API is configured, delete old polygon and create new one
    let polygonId = null;
    if (locationChanged && isApiConfigured()) {
      try {
        // Delete old polygon if it exists
        if (oldPolygonId) {
          toast({
            title: "Updating weather location...",
            description: "Removing old weather monitoring area...",
          });

          // deletePolygon now checks if polygon exists before deletion
          // Returns true if deleted or if it didn't exist (goal achieved either way)
          const deleted = await deletePolygon(oldPolygonId);
          if (deleted) {
            console.log('Old polygon removed or did not exist:', oldPolygonId);
            // Clear old weather cache regardless
            const oldCacheKey = `agromonitoring_weather_${oldPolygonId}`;
            const oldForecastKey = `agromonitoring_forecast_${oldPolygonId}`;
            localStorage.removeItem(oldCacheKey);
            localStorage.removeItem(oldForecastKey);
          }
          // If deletion fails for other reasons (not 404), we still proceed to create new polygon
        }

        toast({
          title: "Updating weather location...",
          description: "Creating weather monitoring area for your new location.",
        });

        polygonId = await createPolygon(
          formData.location,
          `${formData.name || 'Farm'} Location`
        );
      } catch (error: any) {
        console.error('Error creating polygon:', error);
        toast({
          title: "Weather update warning",
          description: "Profile updated, but weather location couldn't be updated. You can try again later.",
          variant: "destructive",
        });
      }
    }

    // Update profile, including polygon_id if it was created
    const updateData: any = {
      name: formData.name,
      email: formData.email,
      location: formData.location,
      farm_size: formData.farmSize,
      crops_planted: cropsArray,
      bio: formData.bio,
      updated_at: new Date().toISOString(),
    };

    // Only update polygon_id if it was just created (location changed)
    if (polygonId) {
      updateData.polygon_id = polygonId;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Update original location to new location
      setOriginalLocation(formData.location);
      
      // Update polygon_id state if it was created
      if (polygonId) {
        setOldPolygonId(polygonId);
      }

      if (locationChanged && polygonId) {
        toast({
          title: "Profile updated!",
          description: "Your profile and weather location have been updated successfully.",
        });
      } else if (locationChanged && !polygonId && isApiConfigured()) {
        toast({
          title: "Profile updated",
          description: "Your profile was updated, but weather location update failed. Please check your API key.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile updated!",
          description: "Your profile information has been saved successfully.",
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Avatar Section */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=15260%32&color=fff`}
                alt={formData.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/20"
              />
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">{formData.name || "Loading..."}</h2>
              <p className="text-muted-foreground">{isLoadingProfile ? "Loading..." : "Farmer"}</p>
              {!isLoadingProfile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      {isLoadingProfile ? (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="mt-6">
          <CardHeader>
            <CardTitle>Farm Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Farm Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="farmSize"
                    value={formData.farmSize}
                    onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crops">Crops Planted</Label>
              <div className="relative">
                <Leaf className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Textarea
                  id="crops"
                  value={formData.crops}
                  onChange={(e) => setFormData({ ...formData, crops: e.target.value })}
                  placeholder="e.g., Maize, Beans, Tomatoes"
                  className="pl-10"
                  rows={2}
                />
              </div>
              <p className="text-sm text-muted-foreground">Separate multiple crops with commas</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="hero" disabled={isLoading}>
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};

export default Profile;
