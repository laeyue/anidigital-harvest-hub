import { GetServerSideProps } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const categories = [
  { value: "all", label: "All Categories" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "grains", label: "Grains" },
  { value: "dairy", label: "Dairy" },
  { value: "livestock", label: "Livestock" },
];
import { Search, Plus, MapPin, Star, ShoppingCart, Filter, Store, Upload, X, MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import logger from "@/lib/logger";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  category: string;
  image_url: string | null;
  location: string | null;
  rating: number;
  seller_id: string;
  profiles?: {
    name: string;
  };
}

// Component to link to shop by seller_id
const ShopLink = ({ sellerId }: { sellerId: string }) => {
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadShop = async () => {
      const { data } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', sellerId)
        .single();
      if (data) {
        setShopId(data.id);
      }
      setIsLoading(false);
    };
    loadShop();
  }, [sellerId]);

  if (isLoading || !shopId) return null;

  return (
    <Link 
      href={`/app/shop/${shopId}`}
      onClick={(e) => e.stopPropagation()}
      className="text-primary hover:underline text-xs flex items-center gap-1"
    >
      <Store className="w-3 h-3" />
      Visit Shop
    </Link>
  );
};

const Marketplace = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    unit: "kg",
    quantity: "",
    category: "vegetables",
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  interface UserShop {
    id: string;
    name?: string;
    description?: string;
    location?: string;
  }
  const [userShop, setUserShop] = useState<UserShop | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync search query from URL params
  useEffect(() => {
    const searchParam = router.query.search as string | undefined;
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, [router.query]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles:seller_id (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  const loadUserShop = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    setUserShop(data);
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (user) {
      loadUserShop();
    }
  }, [user, loadUserShop]);

  const filteredProducts = products.filter((product) => {
    // Enhanced search: search in name, description, and seller name
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === "" || 
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.profiles?.name && product.profiles.name.toLowerCase().includes(searchLower));
    
    const matchesCategory =
      selectedCategory === "all" ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPrice = Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);

  const handleBuy = (product: Product) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    if (product.seller_id === user.id) {
      toast({
        title: "Cannot Purchase",
        description: "You cannot purchase your own product.",
        variant: "destructive",
      });
      return;
    }

    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setIsPurchaseDialogOpen(true);
  };

  const handleMessageSeller = async (product: Product) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to send a message.",
        variant: "destructive",
      });
      return;
    }

    if (product.seller_id === user.id) {
      toast({
        title: "This is your listing",
        description: "You cannot start a conversation with yourself.",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        p_user_id: user.id,
        p_other_user_id: product.seller_id,
        p_context_type: "product",
        p_context_id: product.id,
      });

      if (error || !data) {
        throw error || new Error("Failed to open conversation");
      }

      interface ConversationResult {
        id: string;
      }
      router.push(`/app/chat/${(data as ConversationResult).id}`);
    } catch (err) {
      logger.error("Error opening conversation:", err);
      toast({
        title: "Error",
        description: "Failed to open chat with seller.",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;

    setIsProcessingPurchase(true);

    try {
      const totalAmount = selectedProduct.price * purchaseQuantity;

      // Check if product has enough quantity
      if (purchaseQuantity > selectedProduct.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${selectedProduct.quantity} ${selectedProduct.unit} available.`,
          variant: "destructive",
        });
        setIsProcessingPurchase(false);
        return;
      }

      // Create or reuse conversation for this buyer/seller
      const { data: conv, error: convError } = await supabase.rpc("get_or_create_conversation", {
        p_user_id: user.id,
        p_other_user_id: selectedProduct.seller_id,
        p_context_type: "product",
        p_context_id: selectedProduct.id,
      });

      if (convError || !conv) {
        throw convError || new Error("Failed to open conversation");
      }

      interface ConversationResult {
        id: string;
      }
      const conversationId = (conv as ConversationResult).id;

      // Create chat_order record
      const { data: order, error: orderError } = await supabase
        .from("chat_orders")
        .insert({
          conversation_id: conversationId,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: purchaseQuantity,
          unit: selectedProduct.unit,
          unit_price: selectedProduct.price,
          total_amount: totalAmount,
          buyer_id: user.id,
          seller_id: selectedProduct.seller_id,
          status: "requested",
        })
        .select("*")
        .single();

      if (orderError || !order) {
        throw orderError || new Error("Failed to create chat order");
      }

      // Send an order message into the chat so seller sees the context
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `order:${order.id}`,
      });

      toast({
        title: "Order sent via chat",
        description: "Your order details were sent to the seller. Continue in chat to arrange payment.",
      });

      setIsPurchaseDialogOpen(false);
      setSelectedProduct(null);
      interface ConversationResult {
        id: string;
      }
      router.push(`/app/chat/${(conv as ConversationResult).id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing your purchase.";
      logger.error('Error processing purchase:', error);
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setProductImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProductImage = () => {
    setProductImageFile(null);
    setProductImagePreview(null);
    if (productFileInputRef.current) {
      productFileInputRef.current.value = '';
    }
  };

  const handleProductImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
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
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setProductImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !user) return;

    setIsDeleting(true);
    try {
      // Check if there are any orders for this product
      const { data: orders, error: ordersError } = await supabase
        .from('chat_orders')
        .select('id')
        .eq('product_id', productToDelete.id)
        .limit(1);

      if (ordersError) {
        throw ordersError;
      }

      if (orders && orders.length > 0) {
        toast({
          title: "Cannot Delete Product",
          description: "This product has existing orders and cannot be deleted. You can set the quantity to 0 to stop new purchases.",
          variant: "destructive",
        });
        setProductToDelete(null);
        setIsDeleting(false);
        return;
      }

      // Delete image from storage if it exists
      if (productToDelete.image_url) {
        try {
          // Extract file path from URL
          const urlParts = productToDelete.image_url.split('/');
          const fileName = urlParts.slice(-2).join('/'); // Get user_id/filename
          
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([fileName]);

          if (storageError) {
            logger.error('Error deleting image:', storageError);
            // Continue with product deletion even if image deletion fails
          }
        } catch (err) {
          logger.error('Error processing image deletion:', err);
        }
      }

      // Delete product from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id)
        .eq('seller_id', user.id); // Extra safety check

      if (error) {
        throw error;
      }

      toast({
        title: "Product deleted",
        description: "Your product has been removed from the marketplace.",
      });

      setProductToDelete(null);
      loadProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
      logger.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to list products",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingProduct(true);
    let imageUrl: string | null = null;

    try {
      // Upload image if provided
      if (productImageFile) {
        const fileExt = productImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, productImageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          unit: formData.unit,
          quantity: parseInt(formData.quantity),
          category: formData.category,
          image_url: imageUrl,
        });

      if (error) {
        throw error;
      }

      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        unit: "kg",
        quantity: "",
        category: "vegetables",
      });
      handleRemoveProductImage();
      loadProducts();
      toast({
        title: "Product listed!",
        description: "Your product has been listed on the marketplace.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to list product";
      logger.error('Error adding product:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell fresh farm produce</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <Link href={userShop ? `/app/shop/${userShop.id}` : "/app/my-shop"}>
              <Button variant="outline">
                <Store className="w-4 h-4 mr-2" />
                {userShop ? "My Shop" : "Create Shop"}
              </Button>
            </Link>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4" />
                Sell Item
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[85vh] w-[calc(100vw-2rem)] m-4 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>List a New Product</DialogTitle>
              <DialogDescription>
                Add your product details to list it on the marketplace.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 pr-1 scrollbar-hide -mx-2 px-2">
              <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input 
                  id="productName" 
                  placeholder="e.g., Fresh Tomatoes" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (PHP)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="45" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">per kg</SelectItem>
                      <SelectItem value="bundle">per bundle</SelectItem>
                      <SelectItem value="piece">per piece</SelectItem>
                      <SelectItem value="crate">per crate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Available Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  placeholder="500" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="grains">Grains</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your product..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Product Image</Label>
                <input
                  ref={productFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageChange}
                  className="hidden"
                />
                {productImagePreview ? (
                  <div className="relative">
                    <div
                      className="border-2 border-border rounded-xl overflow-hidden relative group"
                      onDrop={handleProductImageDrop}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={productImagePreview}
                        alt="Product preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveProductImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => productFileInputRef.current?.click()}
                    onDrop={handleProductImageDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={isUploadingProduct}>
                {isUploadingProduct ? "Uploading..." : "List Product"}
              </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-4 w-full md:w-72">
              <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>PHP {priceRange[0]}</span>
                  <span>PHP {priceRange[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <Card variant="glass" className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} variant="glass" className="overflow-hidden hover-lift group">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url || "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-primary">
                      PHP {Number(product.price).toLocaleString()}/{product.unit}
                    </span>
                  </div>
                  {user && user.id === product.seller_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductToDelete(product);
                      }}
                      className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors shadow-lg"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-1 text-accent">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
                    </div>
                  </div>
                  {product.location && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{product.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Seller</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.profiles?.name || "Unknown"}</p>
                        <ShopLink sellerId={product.seller_id} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="inline-flex items-center gap-1"
                        onClick={() => handleMessageSeller(product)}
                        disabled={user?.id === product.seller_id}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message Seller
                      </Button>
                      <Button 
                        variant="hero" 
                        size="sm" 
                        onClick={() => handleBuy(product)}
                        disabled={product.quantity === 0}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {product.quantity === 0 ? 'Out of Stock' : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card variant="glass" className="p-12 text-center">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </Card>
          )}

          {/* Purchase Dialog */}
          <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
            <DialogContent className="sm:max-w-md max-h-[85vh] w-[calc(100vw-2rem)] m-4 overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Purchase Product</DialogTitle>
                <DialogDescription>
                  Complete your purchase of {selectedProduct?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedProduct && (
                <div className="overflow-y-auto flex-1 pr-1 scrollbar-hide -mx-2 px-2">
                  <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quantity ({selectedProduct.unit})</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedProduct.quantity}
                      value={purchaseQuantity}
                      onChange={(e) => {
                        const qty = Math.max(1, Math.min(selectedProduct.quantity, parseInt(e.target.value) || 1));
                        setPurchaseQuantity(qty);
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Available: {selectedProduct.quantity} {selectedProduct.unit}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Price per {selectedProduct.unit}</Label>
                    <p className="text-lg font-semibold">PHP {selectedProduct.price.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">Total Amount</Label>
                      <p className="text-2xl font-bold text-primary">
                        PHP {(selectedProduct.price * purchaseQuantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll be redirected to chat with the seller to arrange payment and delivery details.
                    </p>
                  </div>
                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={isProcessingPurchase || purchaseQuantity > selectedProduct.quantity}
                  >
                    {isProcessingPurchase ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Confirm Purchase
                      </>
                    )}
                  </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default Marketplace;

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
