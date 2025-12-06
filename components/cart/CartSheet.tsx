// CartSheet.tsx
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/currency";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog";
import { C } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

//
// Read Supabase token
//
function getAccessToken() {
  try {
    const key = Object.keys(localStorage).find((k) => k.includes("-auth-token"));
    if (!key) return null;

    const session = JSON.parse(localStorage.getItem(key)!);
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export function CartSheet() {
  const { items, subtotal, updateQty, removeItem, deliveryCharge } = useCart();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState<"jazzcash" | "bank">("jazzcash");
  const [showSuccess, setShowSuccess] = useState(false);

  const totalProducts = items.reduce((sum, i) => sum + i.qty, 0);
  const totalWithDelivery = subtotal + deliveryCharge;
  const advance = Math.round(totalWithDelivery * 0.25);

  //
  // Confirm Order
  //
  const onConfirm = async () => {
    if (!user || items.length === 0) return;

    const token = getAccessToken();
    if (!token) {
      alert("Missing access token.");
      return;
    }

    const orderData = {
      user_id: user.id,
      order_time: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/orders/from-cart/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Order failed");
      }

      setOpen(false);
      setShowSuccess(true);
      window.location.reload();
    } catch (e: any) {
      console.error("Order error:", e);
      alert(e.message);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="relative">
            Cart
            <span className="ml-2 rounded-full bg-accent text-accent-foreground px-2 text-xs">
              {items.reduce((s, i) => s + i.qty, 0)}
            </span>
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Your Cart</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-3 border rounded-lg p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded object-cover" />

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} · {item.collection}
                        </p>
                        {item.color && (
                          <p className="text-xs text-muted-foreground">Color: {item.color}</p>
                        )}

                      </div>

                      <button
                        className="text-sm text-destructive"
                        onClick={() => removeItem(item.id, item.size, item.color ?? null)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          className="bg-secondary text-secondary-foreground"
                          onClick={() => updateQty(item.id, item.size, item.color ?? null, Math.max(1, item.qty - 1))}
                        >
                          -
                        </Button>

                        <Input
                          value={item.qty}
                          onChange={(e) =>
                            updateQty(item.id, item.size, item.color ?? null, Number(e.target.value) || 1)
                          }
                          className="w-16 text-center"
                        />

                        <Button
                          className="bg-secondary text-secondary-foreground"
                          onClick={() => updateQty(item.id, item.size, item.color ?? null, item.qty + 1)}
                        >
                          +
                        </Button>
                      </div>

                      <p className="font-medium">
                        {item.discount && item.discount > 0 ? (
                          <>
                            <span className="line-through text-muted-foreground mr-1">
                              {formatPKR(item.price)}
                            </span>
                            <span>
                              {formatPKR(item.price - (item.price * item.discount) / 100)}
                            </span>
                          </>
                        ) : (
                          formatPKR(item.price)
                        )}
                      </p>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FREE DELIVERY OFFER */}
<div className="p-4 rounded-xl border border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 shadow-sm">
  <div className="flex items-start gap-3">
    <span className="text-purple-600 text-xl">✨</span>
    <div className="text-purple-700 text-sm leading-relaxed">
      <strong className="font-semibold text-purple-800">Special Offer!</strong><br />
      Buy <strong>3 or more products</strong> OR spend over <strong>Rs 5,000</strong>  
      to enjoy <span className="underline font-semibold">Free Delivery</span> 🚚
    </div>
  </div>
</div>



          {/* Summary */}
          <div className="mt-4 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>

            {deliveryCharge > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Delivery Charge</span>
                <span>{formatPKR(deliveryCharge)}</span>
              </div>
            )}

            <div className="font-semibold flex justify-between text-sm border-t pt-2">
              <span>Total</span>
              <span>{formatPKR(totalWithDelivery)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Advance (25%)</span>
              <span>{formatPKR(advance)}</span>
            </div>
          </div>

          {/* Checkout */}
          <div className="mt-4 flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1" disabled={!user || items.length === 0}>
                  Proceed to Checkout
                </Button>
              </DialogTrigger>

              <DialogContent>

                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-center">
                    Confirm Advance Payment
                  </DialogTitle>
                </DialogHeader>
              
                <div className="space-y-3 mt-2">
              
                  {/* Amount Box */}
                  <div className="border rounded-md p-3 bg-muted text-center">
                    <p className="text-sm text-muted-foreground">Amount to Pay Now</p>
                    <p className="text-xl font-bold">Rs {advance}</p>
                  </div>
              
                  {/* Plain Instructions */}
                  <div className="text-sm space-y-2 leading-relaxed">
              
                    <p>
                      Please send the advance payment to the following account and 
                      share the screenshot on WhatsApp or email. 
                      Your order status will be updated within <strong>1 hour</strong>.
                    </p>
              
                    <p>
                      <strong>JazzCash:</strong> 0324-0405762 (MARIYEM NABEEL)
                    </p>
              
                    <p>
                      <strong>Bank Transfer (Bank AL Habib):</strong><br />
                      PK03BAHL5509008101070301 (Maryam Nabeel)
                    </p>
              
                    <p>
                      <strong>Email proof:</strong> rangistaarttowear@gmail.com
                    </p>
              
                    <p className="text-muted-foreground">
                      You can view your order and payment status anytime in the <strong>Orders</strong> page.
                    </p>
              
                  </div>
              
                </div>
              
                <DialogFooter>
                  <Button onClick={onConfirm} className="w-full">
                    I will pay
                  </Button>
                </DialogFooter>
              
              </DialogContent>

            </Dialog>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-center">
              Order Placed Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              We have received your advance payment. Your order is now under verification.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogAction className="mx-auto w-1/2">OK</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
