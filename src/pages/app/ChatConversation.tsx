import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createTransactionNotification } from "@/lib/notifications";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationHeader {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  other_participant: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

const ChatConversation = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [header, setHeader] = useState<ConversationHeader | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [chatOrders, setChatOrders] = useState<any[]>([]);
  const pollingRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSeenRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const el = messagesContainerRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);
  };

  useEffect(() => {
    if (!conversationId || !user) return;

    const loadInitial = async () => {
      setLoading(true);

      const { data: convData } = await supabase.rpc("get_conversation_header", {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });

      if (convData && (convData as any[]).length > 0) {
        setHeader((convData as any[])[0] as ConversationHeader);
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs as Message[]);
        if (msgs.length > 0) {
          lastSeenRef.current = (msgs[msgs.length - 1] as Message).created_at;
        }
      }

      // Load chat orders for this conversation
      const { data: orders } = await supabase
        .from("chat_orders")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (orders) {
        setChatOrders(orders as any[]);
      }

      setLoading(false);
      scrollToBottom();
      await markAsRead();
    };

    loadInitial();

    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
    }

    pollingRef.current = window.setInterval(async () => {
      if (!lastSeenRef.current || !conversationId) return;

      const { data: newMsgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .gt("created_at", lastSeenRef.current)
        .order("created_at", { ascending: true });

      if (newMsgs && newMsgs.length > 0) {
        setMessages((prev) => {
          const combined = [...prev, ...(newMsgs as Message[])];
          lastSeenRef.current = combined[combined.length - 1].created_at;
          return combined;
        });
        scrollToBottom();
        await markAsRead();

        // Also refresh chat orders so status changes (requested/pending/paid) reflect for both sides
        const { data: orders } = await supabase
          .from("chat_orders")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        if (orders) {
          setChatOrders(orders as any[]);
        }
      }
    }, 3000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!conversationId || !user) return;

    if (!newMessage.trim() && !imageFile) return;

    let content = newMessage.trim();

    // If there's an image, upload it and send as an image message
    if (imageFile) {
      setUploadingImage(true);
      try {
        const ext = imageFile.name.split(".").pop();
        // Match existing RLS pattern used for product images: first segment is user.id
        const fileName = `${user.id}/chat-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(fileName);

        // Encode as image message; optionally include text after a space
        content = content
          ? `image:${publicUrl} ${content}`
          : `image:${publicUrl}`;
      } catch (err) {
        console.error("Error uploading image:", err);
        toast({
          title: "Image upload failed",
          description: "Please try again or choose a different image.",
          variant: "destructive",
        });
        setUploadingImage(false);
        return;
      } finally {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }

    setNewMessage("");
    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select("*")
      .single();

    setSending(false);

    if (error || !data) {
      console.error("Error sending message:", error);
      toast({
        title: "Message failed",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setMessages((prev) => {
      const combined = [...prev, data as Message];
      lastSeenRef.current = combined[combined.length - 1].created_at;
      return combined;
    });
    scrollToBottom();
    setUploadingImage(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <Card className="flex-1 flex flex-col max-h-full border border-border/60 bg-card/80 backdrop-blur-xl shadow-glass">
        <CardHeader className="border-b flex flex-row items-center gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {header?.other_participant?.avatar_url && (
                <AvatarImage
                  src={header.other_participant.avatar_url}
                  alt={header.other_participant.name || "User"}
                />
              )}
              <AvatarFallback>
                {header?.other_participant?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {header?.other_participant?.name ||
                  header?.other_participant?.email ||
                  "Conversation"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Chat between you and this user.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
            ref={messagesContainerRef}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-4">
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;

                // Order message
                if (msg.content.startsWith("order:")) {
                  const orderId = msg.content.substring(6).trim();
                  const order = chatOrders.find((o) => o.id === orderId);

                  if (!order) {
                    return null;
                  }

                  const isSeller = user.id === order.seller_id;
                  const status = (order.status || "requested") as string;
                  const statusLabel =
                    status === "pending_payment"
                      ? "Pending Payment"
                      : status === "paid"
                      ? "Paid"
                      : "Requested";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[90%] rounded-2xl px-3 py-2 text-xs sm:text-sm shadow-sm bg-muted border border-border">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                          Order Summary
                        </p>
                        <p className="font-semibold">
                          {order.product_name} • {order.quantity}
                          {order.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PHP {Number(order.unit_price).toLocaleString()} per {order.unit}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          Total: PHP {Number(order.total_amount).toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px]">
                          Status:{" "}
                          <span
                            className={
                              status === "paid"
                                ? "text-emerald-600 font-semibold"
                                : status === "pending_payment"
                                ? "text-amber-600 font-semibold"
                                : "text-blue-600 font-semibold"
                            }
                          >
                            {statusLabel}
                          </span>
                        </p>
                        {isSeller && status !== "paid" && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const { data, error } = await supabase
                                    .from("chat_orders")
                                    .update({ status: "pending_payment" })
                                    .eq("id", order.id)
                                    .select("*")
                                    .single();
                                  if (!error && data) {
                                    setChatOrders((prev) =>
                                      prev.map((o) => (o.id === data.id ? data : o))
                                    );
                                    await supabase.from("messages").insert({
                                      conversation_id: msg.conversation_id,
                                      sender_id: user.id,
                                      content: `order:${order.id}`,
                                    });
                                  }
                                } catch (e) {
                                  console.error("Error updating order:", e);
                                }
                              }}
                            >
                              Mark Pending
                            </Button>
                            <Button
                              size="sm"
                              variant="hero"
                              onClick={async () => {
                                try {
                                  // Update order status to paid
                                  const { data, error } = await supabase
                                    .from("chat_orders")
                                    .update({ status: "paid" })
                                    .eq("id", order.id)
                                    .select("*")
                                    .single();

                                  if (error) throw error;
                                  if (!data) throw new Error("Failed to update order");

                                  // Create transactions for buyer and seller
                                  const today = new Date().toISOString().split("T")[0];
                                  const description = `Purchased ${order.quantity}${order.unit} ${order.product_name}`;
                                  const sellerDescription = `Sold ${order.quantity}${order.unit} ${order.product_name}`;

                                  // Create expense transaction for buyer
                                  const { error: buyerTxError } = await supabase
                                    .from("transactions")
                                    .insert({
                                      user_id: order.buyer_id,
                                      type: "expense",
                                      amount: order.total_amount,
                                      description: description,
                                      date: today,
                                    });

                                  if (buyerTxError) {
                                    console.error("Error creating buyer transaction:", buyerTxError);
                                  }

                                  // Create income transaction for seller
                                  const { error: sellerTxError } = await supabase
                                    .from("transactions")
                                    .insert({
                                      user_id: order.seller_id,
                                      type: "income",
                                      amount: order.total_amount,
                                      description: sellerDescription,
                                      date: today,
                                    });

                                  if (sellerTxError) {
                                    console.error("Error creating seller transaction:", sellerTxError);
                                  }

                                  // Update product quantity
                                  const { data: productData } = await supabase
                                    .from("products")
                                    .select("quantity")
                                    .eq("id", order.product_id)
                                    .single();

                                  if (productData) {
                                    const newQuantity = Math.max(0, productData.quantity - order.quantity);
                                    await supabase
                                      .from("products")
                                      .update({ quantity: newQuantity })
                                      .eq("id", order.product_id);
                                  }

                                  // Send notifications
                                  await createTransactionNotification(
                                    order.buyer_id,
                                    "expense",
                                    order.total_amount,
                                    description
                                  );
                                  await createTransactionNotification(
                                    order.seller_id,
                                    "income",
                                    order.total_amount,
                                    sellerDescription
                                  );

                                  // Update local state
                                  setChatOrders((prev) =>
                                    prev.map((o) => (o.id === data.id ? data : o))
                                  );

                                  // Send order update message
                                  await supabase.from("messages").insert({
                                    conversation_id: msg.conversation_id,
                                    sender_id: user.id,
                                    content: `order:${order.id}`,
                                  });

                                  toast({
                                    title: "Order confirmed",
                                    description: "Transactions have been recorded and product quantity updated.",
                                  });
                                } catch (e: any) {
                                  console.error("Error updating order:", e);
                                  toast({
                                    title: "Error",
                                    description: e.message || "Failed to confirm order. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Mark Paid
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Image message
                const isImage = msg.content.startsWith("image:");
                let imageUrl: string | null = null;
                let textContent: string | null = msg.content;

                if (isImage) {
                  const parts = msg.content.substring(6).trim().split(" ");
                  imageUrl = parts[0];
                  textContent = parts.slice(1).join(" ") || null;
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      {isImage && imageUrl ? (
                        <div className="space-y-2">
                          <img
                            src={imageUrl}
                            alt="Attachment"
                            className="rounded-lg max-h-64 object-cover cursor-pointer"
                            onClick={() => setFullImageUrl(imageUrl!)}
                          />
                          {textContent && <p>{textContent}</p>}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t px-3 py-2 flex items-center gap-2">
            {imagePreview && (
              <div className="flex items-center gap-2 mr-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-10 h-10 rounded-md object-cover border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) return;
                if (file.size > 5 * 1024 * 1024) return;
                setImageFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setImagePreview(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || uploadingImage || (!newMessage.trim() && !imageFile)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!fullImageUrl} onOpenChange={(open) => !open && setFullImageUrl(null)}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)]">
          {fullImageUrl && (
            <img
              src={fullImageUrl}
              alt="Full size attachment"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatConversation;


