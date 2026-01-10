"use client";

import { GetServerSideProps } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Mail, Star, ShoppingCart, Package, Edit2, Plus, Upload, X, MessageCircle, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";

interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  location: string | null;
  contact_info: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

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
}

const categories = [
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "grains", label: "Grains" },
  { value: "dairy", label: "Dairy" },
  { value: "livestock", label: "Livestock" },
];

interface ShopProps {
  shopId?: string;
}

const Shop = ({ shopId: shopIdProp }: ShopProps = {}) => {
  // Extract shopId from URL pathname if not provided as prop
  const getShopIdFromUrl = () => {
    if (shopIdProp) return shopIdProp;
    if (typeof window === "undefined") return undefined;
    const pathParts = window.location.pathname.split("/");
    const shopIndex = pathParts.indexOf("shop");
    if (shopIndex !== -1 && shopIndex < pathParts.length - 1) {
      return pathParts[shopIndex + 1];
    }
    return undefined;
  };
  const shopId = getShopIdFromUrl();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    location: "",
    contact_info: "",
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productFormData, setProductFormData] = useState({
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
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadShop = useCallback(async () => {
    if (!shopId) return;

    setIsLoading(true);
    try {
      // Load shop details
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select(`
          *,
          profiles:owner_id (
            name,
            email,
            avatar_url
          )
        `)
        .eq('id', shopId)
        .single();

      if (shopError) throw shopError;
      setShop(shopData);
      setEditFormData({
        name: shopData.name || "",
        description: shopData.description || "",
        location: shopData.location || "",
        contact_info: shopData.contact_info || "",
      });

      // Load shop products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', shopData.owner_id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load shop";
      console.error('Error loading shop:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [shopId, toast]);

  useEffect(() => {
    if (shopId) {
      loadShop();
    }
  }, [shopId, loadShop]);

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

    if (product.quantity === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setIsPurchaseDialogOpen(true);
  };

  const handleMessageShopOwner = async () => {
    if (!user || !shop) {
      toast({
        title: "Login Required",
        description: "Please log in to send a message.",
        variant: "destructive",
      });
      return;
    }

    if (user.id === shop.owner_id) {
      toast({
        title: "This is your shop",
        description: "You cannot start a conversation with yourself.",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        p_user_id: user.id,
        p_other_user_id: shop.owner_id,
        p_context_type: "shop",
        p_context_id: shop.id,
      });

      if (error || !data) {
        throw error || new Error("Failed to open conversation");
      }

      interface ConversationResult {
        id: string;
      }
      // Navigate to chat - use window.location as router may not be available during SSR
      if (typeof window !== "undefined") {
        window.location.href = `/app/chat/${(data as ConversationResult).id}`;
      }
    } catch (err) {
      console.error("Error opening conversation:", err);
      toast({
        title: "Error",
        description: "Failed to open chat with shop owner.",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;

    setIsProcessingPurchase(true);
    try {
      const totalAmount = selectedProduct.price * purchaseQuantity;

      if (purchaseQuantity > selectedProduct.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${selectedProduct.quantity} ${selectedProduct.unit} available.`,
          variant: "destructive",
        });
        setIsProcessingPurchase(false);
        return;
      }

      if (!shop) {
        throw new Error("Shop not loaded");
      }

      const { data: conv, error: convError } = await supabase.rpc("get_or_create_conversation", {
        p_user_id: user.id,
        p_other_user_id: shop.owner_id,
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
          seller_id: shop.owner_id,
          status: "requested",
        })
        .select("*")
        .single();

      if (orderError || !order) {
        throw orderError || new Error("Failed to create chat order");
      }

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
      router.push(`/app/chat/${conversationId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing your purchase.";
      console.error('Error processing purchase:', error);
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !user || !shop) return;

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
            console.error('Error deleting image:', storageError);
            // Continue with product deletion even if image deletion fails
          }
        } catch (err) {
          console.error('Error processing image deletion:', err);
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
        description: "Your product has been removed from your shop.",
      });

      setProductToDelete(null);
      loadShop(); // Reload shop to refresh products
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!shop || !user) return;

    setIsSavingDetails(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: editFormData.name,
          description: editFormData.description || null,
          location: editFormData.location || null,
          contact_info: editFormData.contact_info || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shop.id);

      if (error) throw error;

      toast({
        title: "Shop Updated!",
        description: "Your shop information has been updated successfully.",
      });

      setIsEditingDetails(false);
      loadShop(); // Reload shop data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update shop";
      console.error('Error updating shop:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCancelEdit = () => {
    if (shop) {
      setEditFormData({
        name: shop.name || "",
        description: shop.description || "",
        location: shop.location || "",
        contact_info: shop.contact_info || "",
      });
    }
    setIsEditingDetails(false);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shop) {
      toast({
        title: "Error",
        description: "You must be logged in to add products",
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

      // Create product
      const { error } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          name: productFormData.name,
          description: productFormData.description,
          price: parseFloat(productFormData.price),
          unit: productFormData.unit,
          quantity: parseInt(productFormData.quantity),
          category: productFormData.category,
          image_url: imageUrl,
        });

      if (error) throw error;

      setIsProductDialogOpen(false);
      setProductFormData({
        name: "",
        description: "",
        price: "",
        unit: "kg",
        quantity: "",
        category: "vegetables",
      });
      handleRemoveProductImage();
      loadShop(); // Reload to show new product
      toast({
        title: "Product Added!",
        description: "Your product has been added to your shop.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add product";
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingProduct(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <Card variant="glass" className="p-12 text-center">
        <p className="text-muted-foreground">Shop not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shop Banner & Info */}
      <Card variant="glass" className="overflow-hidden">
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-emerald/20 group">
          {shop.banner_url && (
            <img
              src={shop.banner_url}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          )}
          {user && user.id === shop.owner_id && (
            <Link
              href="/app/my-shop"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-5 h-5 text-white" />
            </Link>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 relative group">
              {user && user.id === shop.owner_id && !isEditingDetails && (
                <button
                  onClick={() => setIsEditingDetails(true)}
                  className="absolute top-0 right-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              )}
              
              {!isEditingDetails ? (
                <>
                  <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
                  {shop.description && (
                    <p className="text-muted-foreground mb-4">{shop.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {shop.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{shop.location}</span>
                      </div>
                    )}
                    {shop.contact_info && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{shop.contact_info}</span>
                      </div>
                    )}
                    {shop.profiles && (
                      <div className="flex items-center gap-2">
                        <span>Owner: {shop.profiles.name}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Shop Name</label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="text-2xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={3}
                      placeholder="Tell customers about your shop..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={editFormData.location}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                          className="pl-10"
                          placeholder="e.g., Kapatagan, Lanao Del Norte"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Contact Info</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={editFormData.contact_info}
                          onChange={(e) => setEditFormData({ ...editFormData, contact_info: e.target.value })}
                          className="pl-10"
                          placeholder="e.g., +63 912 345 6789"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSavingDetails}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="hero"
                      onClick={handleSaveDetails}
                      disabled={isSavingDetails || !editFormData.name.trim()}
                    >
                      {isSavingDetails ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              {user && user.id !== shop.owner_id && (
                <Button
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={handleMessageShopOwner}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message Shop Owner
                </Button>
              )}
              {user && user.id === shop.owner_id && !isEditingDetails && (
                <Link href={`/app/my-shop`}>
                  <Button variant="hero">Manage Shop</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Products</h2>
          {user && user.id === shop.owner_id && (
            <Button
              variant="hero"
              onClick={() => setIsProductDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          )}
        </div>
        {products.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">No products available in this shop yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} variant="glass" className="overflow-hidden hover-lift group">
                <div className="relative aspect-[4/3] overflow-hidden">
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
                  {user && user.id === shop?.owner_id && (
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
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Stock: {product.quantity} {product.unit}
                    </div>
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => handleBuy(product)}
                      disabled={product.quantity === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.quantity === 0 ? 'Out of Stock' : 'Buy Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll be redirected to chat with the seller to arrange payment and delivery details.
                  </p>
                </div>
              </div>
              <Button
                variant="hero"
                className="w-full"
                onClick={handlePurchase}
                disabled={isProcessingPurchase || purchaseQuantity > selectedProduct.quantity}
              >
                {isProcessingPurchase ? "Processing..." : "Confirm Purchase"}
              </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] w-[calc(100vw-2rem)] m-4 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add Product to Shop</DialogTitle>
            <DialogDescription>
              Add a new product to your shop. Fill in all the required details.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 scrollbar-hide -mx-2 px-2">
            <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g., Fresh Tomatoes"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (PHP) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={productFormData.unit}
                  onValueChange={(value) => setProductFormData({ ...productFormData, unit: value })}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                    <SelectItem value="bunch">bunch</SelectItem>
                    <SelectItem value="bag">bag</SelectItem>
                    <SelectItem value="liter">liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={productFormData.quantity}
                  onChange={(e) => setProductFormData({ ...productFormData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={productFormData.category}
                  onValueChange={(value) => setProductFormData({ ...productFormData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Describe your product..."
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                rows={3}
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
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsProductDialogOpen(false);
                  setProductFormData({
                    name: "",
                    description: "",
                    price: "",
                    unit: "kg",
                    quantity: "",
                    category: "vegetables",
                  });
                  handleRemoveProductImage();
                }}
                className="flex-1"
                disabled={isUploadingProduct}
              >
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={isUploadingProduct}>
                {isUploadingProduct ? "Uploading..." : "Add Product"}
              </Button>
            </div>
          </form>
          </div>
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
    </div>
  );
};

export default Shop;

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

