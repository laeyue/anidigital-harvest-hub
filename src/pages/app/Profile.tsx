import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockUser } from "@/lib/mockData";
import { User, Mail, MapPin, Ruler, Leaf, Save, Camera } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [formData, setFormData] = useState({
    name: mockUser.name,
    email: mockUser.email,
    location: mockUser.farmLocation,
    farmSize: mockUser.farmSize,
    crops: mockUser.cropsPlanted.join(", "),
    bio: "Passionate farmer focused on sustainable agriculture and quality produce.",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved successfully.",
      });
    }, 1000);
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
                src={mockUser.avatar}
                alt={mockUser.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/20"
              />
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">{mockUser.name}</h2>
              <p className="text-muted-foreground">{mockUser.role}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {new Date(mockUser.joinedDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
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
    </div>
  );
};

export default Profile;
