"use client";

import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PaymentProof {
  id: string;
  transaction_id: string | null;
  buyer_id: string;
  seller_id: string;
  amount: number;
  reference_id: string | null;
  screenshot_url: string | null;
  notes: string | null;
  status: "pending" | "verified" | "rejected" | string;
  created_at: string;
  updated_at: string;
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const ShopPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "verified" | "rejected" | "all">("pending");
  const [selected, setSelected] = useState<PaymentProof | null>(null);
  const [sellerNote, setSellerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading payments:", error);
        toast({
          title: "Error",
          description: "Failed to load payments.",
          variant: "destructive",
        });
      } else {
        setPayments((data || []) as PaymentProof[]);
      }
      setLoading(false);
    };
    load();
  }, [user, toast]);

  const filteredPayments =
    filter === "all"
      ? payments
      : payments.filter((p) => p.status.toLowerCase() === filter);

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("verify_manual_payment", {
        p_payment_proof_id: selected.id,
        p_new_status: status,
        p_reason: sellerNote || null,
      });
      if (error) throw error;
      const updated = data as PaymentProof;
      setPayments((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      toast({
        title: status === "verified" ? "Payment verified" : "Payment rejected",
        description:
          status === "verified"
            ? "Buyer will now see this payment as verified."
            : "Buyer will now see this payment as rejected.",
      });
      setSelected(null);
      setSellerNote("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update payment.";
      console.error("Error verifying payment:", err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Shop Payments</h1>
        <p className="text-muted-foreground">
          Review manual payment proofs submitted by your buyers.
        </p>
      </div>

      <Card variant="glass">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Payment Proofs</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant={filter === "pending" ? "hero" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "verified" ? "hero" : "outline"}
              size="sm"
              onClick={() => setFilter("verified")}
            >
              Verified
            </Button>
            <Button
              variant={filter === "rejected" ? "hero" : "outline"}
              size="sm"
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </Button>
            <Button
              variant={filter === "all" ? "hero" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment proofs found for this filter.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setSellerNote("");
                  }}
                  className="w-full text-left rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/60 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        PHP {Number(p.amount).toLocaleString()}
                      </span>
                      <Badge
                        className={
                          "text-xs " +
                          (statusColor[p.status.toLowerCase()] ||
                            "bg-muted text-foreground")
                        }
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </div>
                    {p.reference_id && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {p.reference_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Submitted{" "}
                      {formatDistanceToNow(new Date(p.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>ID: {p.id.slice(0, 8)}...</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] w-[calc(100vw-2rem)] m-4 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="overflow-y-auto flex-1 pr-1 scrollbar-hide -mx-2 px-2 space-y-4">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Amount: </span>
                  PHP {Number(selected.amount).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status: </span>
                  <Badge
                    className={
                      "text-xs " +
                      (statusColor[selected.status.toLowerCase()] ||
                        "bg-muted text-foreground")
                    }
                  >
                    {selected.status.toUpperCase()}
                  </Badge>
                </p>
                {selected.reference_id && (
                  <p className="text-sm">
                    <span className="font-medium">Reference ID: </span>
                    {selected.reference_id}
                  </p>
                )}
                {selected.transaction_id && (
                  <p className="text-sm text-muted-foreground">
                    Linked transaction ID: {selected.transaction_id}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {formatDistanceToNow(new Date(selected.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {selected.screenshot_url && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Screenshot</p>
                  <img
                    src={selected.screenshot_url}
                    alt="Payment screenshot"
                    className="max-h-80 w-auto rounded-lg border object-contain"
                  />
                </div>
              )}

              {selected.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Buyer Notes</p>
                  <p className="text-sm whitespace-pre-line text-muted-foreground">
                    {selected.notes}
                  </p>
                </div>
              )}

              {selected.status === "pending" && (
                <div className="space-y-3 border-t pt-3">
                  <p className="text-sm font-medium">Decision</p>
                  <Textarea
                    placeholder="Optional note to the buyer (e.g. payment confirmed, will ship tomorrow)..."
                    value={sellerNote}
                    onChange={(e) => setSellerNote(e.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="hero"
                      onClick={() => handleVerify("verified")}
                      disabled={submitting}
                    >
                      {submitting ? "Updating..." : "Approve Payment"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVerify("rejected")}
                      disabled={submitting}
                    >
                      {submitting ? "Updating..." : "Reject Payment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopPayments;

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};






