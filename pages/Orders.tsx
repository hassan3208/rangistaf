// import { FormEvent, useState, useEffect } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { formatPKR } from "@/lib/currency";
// import { getDiscountForCollection, applyDiscount } from "@/data/discount";
// import { getProduct } from "@/data/catalog";
// import { Button } from "@/components/ui/button";
// import { API_BASE_URL } from "@/lib/api-config";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { Star } from "lucide-react";
// import { cn } from "@/lib/utils";


// //
// // Supabase Session Helpers
// //
// function getSupabaseSession() {
//   const key = Object.keys(localStorage).find((k) => k.includes("-auth-token"));
//   if (!key) return null;
//   try {
//     return JSON.parse(localStorage.getItem(key) || "{}");
//   } catch {
//     return null;
//   }
// }

// function getAccessToken() {
//   return getSupabaseSession()?.access_token || null;
// }

// function getUserId() {
//   return getSupabaseSession()?.user?.id || null;
// }



// //
// // TYPES
// //
// interface ReviewTarget {
//   orderId: number;
//   productId: string;
//   productName: string;
//   size?: string;
// }

// interface OrderItem {
//   product_id: string;
//   product_name: string;
//   quantity: number;
//   size?: string;
//   price: number;
//   discount: number;
//   color?: string | null;
// }

// interface Order {
//   order_id: number;
//   user_id: string;
//   username: string;
//   status: string;
//   total_products: number;
//   total_price: number;
//   products: OrderItem[];
//   order_time: string;
// }



// //
// // MAIN COMPONENT
// //
// export default function Orders() {
//   const { user } = useAuth();
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [activeTarget, setActiveTarget] = useState<ReviewTarget | null>(null);
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshToken, setRefreshToken] = useState(0);
//   const [reviewStatus, setReviewStatus] = useState<{ [key: string]: boolean }>({});

//   const STATUS_STYLES: Record<string, { badge: string; border: string; card?: string }> = {
//     pending: { badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-300", card: "bg-yellow-50" },
//     processing: { badge: "bg-blue-100 text-blue-800", border: "border-blue-300", card: "bg-blue-50" },
//     shipped: { badge: "bg-indigo-100 text-indigo-800", border: "border-indigo-300", card: "bg-indigo-50" },
//     delivered: { badge: "bg-green-100 text-green-800", border: "border-green-300", card: "bg-green-50" },
//     canceled: { badge: "bg-red-100 text-red-800", border: "border-red-300", card: "bg-red-50" },
//   };


//   //
//   // FETCH ORDERS
//   //
//   useEffect(() => {
//     const uid = getUserId();
//     const token = getAccessToken();

//     async function loadOrders() {
//       try {
//         if (!uid || !token) {
//           setOrders([]);
//           setLoading(false);
//           return;
//         }

//         const response = await fetch(`${API_BASE_URL}/users/${uid}/orders`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (!response.ok) {
//           if (response.status === 404) {
//             setOrders([]);
//             return;
//           }
//           throw new Error(`Failed to load orders`);
//         }

//         const data: Order[] = await response.json();
//         setOrders(data);

//         // Fetch review status
//         const map: any = {};
//         for (const order of data) {
//           for (const item of order.products) {
//             const key = `${order.order_id}-${item.product_id}-${item.size ?? ""}`;
//             map[key] = await hasReviewForItem(uid, order.order_id, item.product_id, item.size);
//           }
//         }
//         setReviewStatus(map);

//       } catch (err) {
//         console.error(err);
//         setOrders([]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadOrders();
//   }, [refreshToken]);



//   //
//   // CHECK REVIEW
//   //
//   async function hasReviewForItem(
//     uid: string,
//     orderId: number,
//     productId: string,
//     size?: string
//   ) {
//     try {
//       const token = getAccessToken();
//       const res = await fetch(
//         `${API_BASE_URL}/reviews/check?user_id=${uid}&order_id=${orderId}&product_id=${productId}${size ? `&size=${size}` : ""}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (!res.ok) return false;
//       const data = await res.json();
//       return data.reviewed;
//     } catch {
//       return false;
//     }
//   }



//   //
//   // OPEN DIALOG
//   //
//   function openDialog(target: ReviewTarget) {
//     setActiveTarget(target);
//     setRating(5);
//     setComment("");
//     setDialogOpen(true);
//   }

//   function closeDialog() {
//     setDialogOpen(false);
//     setActiveTarget(null);
//   }



//   //
//   // SUBMIT REVIEW
//   //
//   async function handleSubmit(e: FormEvent) {
//     e.preventDefault();

//     if (!activeTarget) return;

//     const uid = getUserId();
//     const token = getAccessToken();

//     const reviewData = {
//       user_id: uid,
//       product_id: activeTarget.productId,
//       stars: rating,
//       text: comment || "",
//       time: new Date().toISOString(),
//     };

//     try {
//       const res = await fetch(`${API_BASE_URL}/reviews/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(reviewData),
//       });

//       if (!res.ok) {
//         console.error(await res.text());
//         throw new Error("Failed to submit review");
//       }

//       const key = `${activeTarget.orderId}-${activeTarget.productId}-${activeTarget.size ?? ""}`;
//       setReviewStatus((prev) => ({ ...prev, [key]: true }));

//       setRefreshToken((p) => p + 1);
//       closeDialog();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to submit review.");
//     }
//   }



//   //
//   // RENDER
//   //
//   if (!user) return <div className="container py-10">Please login to view your orders.</div>;
//   if (loading) return <div className="container py-10">Loading orders...</div>;

//   return (
//     <main className="container py-10">
//       <h1 className="font-serif text-3xl">My Orders</h1>

//       {orders.length === 0 ? (
//         <p className="mt-4 text-muted-foreground">No orders yet.</p>
//       ) : (
//         <div className="mt-6 space-y-5">
//           {orders.map((o) => (
//             <div
//               key={o.order_id}
//               className={`border rounded-lg p-4 space-y-4 ${STATUS_STYLES[o.status]?.card ?? ""}`}
//             >
//               {/* HEADER */}
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="font-semibold">Order #{o.order_id}</p>
//                   <p className="text-xs text-muted-foreground">
//                     {new Date(o.order_time).toLocaleString()}
//                   </p>
//                 </div>

//                 <span
//                   className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[o.status]?.badge}`}
//                 >
//                   {o.status}
//                 </span>
//               </div>

//               {/* PRODUCT LIST */}
//               <ul className="space-y-3">
//                 {o.products.map((item) => {
//                   const prod = getProduct(item.product_id);

//                   const qty = item.quantity || 1;
//                   // Backend already gives line price, so backend unit price:
//                   const backendUnit = Number(item.price) / qty;
                  
//                   // Use backend discount (percentage)
//                   const pct = item.discount || 0;
                  
//                   // Apply discount
//                   const discountedUnit = applyDiscount(backendUnit, pct);
                  
//                   // Final line price
//                   const line = Math.round(discountedUnit * qty);


//                   const key = `${o.order_id}-${item.product_id}-${item.size ?? ""}`;
//                   const reviewed = reviewStatus[key];

//                   return (
//                     <li
//                       key={`${item.product_id}-${item.size ?? ""}`}
//                       className="flex flex-col md:flex-row items-start md:items-center justify-between border p-3 rounded-md"
//                     >
//                       <div className="flex gap-3">
//                         {/* IMAGE */}
//                         <img
//                           src={prod?.image || "/placeholder.svg"}
//                           className="w-16 h-16 rounded-md border object-cover"
//                         />

//                         <div>
//                           <p className="font-medium">{item.product_name}</p>

//                           {prod?.collection && (
//                             <p className="text-xs text-muted-foreground">
//                               Collection: {prod.collection}
//                             </p>
//                           )}


//                           {item.color && (
//                             <p className="text-xs text-muted-foreground">
//                               Color: {item.color}
//                             </p>
//                           )}

//                           <p className="text-xs">
//                             {item.size ? `Size: ${item.size} — ` : ""}
//                             Qty: {item.quantity}
//                           </p>

//                           <p className="text-xs font-semibold">
//                             {formatPKR(discountedUnit)} × {item.quantity} = {formatPKR(line)}
//                           </p>
                          
//                           {pct > 0 && (
//                             <p className="text-xs line-through text-muted-foreground">
//                               {formatPKR(backendUnit)}
//                             </p>
//                           )}

//                         </div>
//                       </div>

//                       {reviewed ? (
//                         <Button variant="secondary" disabled size="sm">
//                           Review submitted
//                         </Button>
//                       ) : (
//                         <Button
//                           size="sm"
//                           onClick={() =>
//                             openDialog({
//                               orderId: o.order_id,
//                               productId: item.product_id,
//                               productName: item.product_name,
//                               size: item.size,
//                             })
//                           }
//                         >
//                           Give Review
//                         </Button>
//                       )}
//                     </li>
//                   );
//                 })}
//               </ul>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* REVIEW DIALOG */}
//       <Dialog open={dialogOpen} onOpenChange={(v) => (v ? setDialogOpen(true) : closeDialog())}>
//         <DialogContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <DialogHeader>
//               <DialogTitle>Review {activeTarget?.productName}</DialogTitle>
//               <DialogDescription>Share your experience.</DialogDescription>
//             </DialogHeader>

//             {/* RATING */}
//             <div>
//               <p className="text-sm font-medium mb-1">Rating</p>
//               <div className="flex gap-1">
//                 {Array.from({ length: 5 }).map((_, idx) => {
//                   const val = idx + 1;
//                   return (
//                     <button
//                       key={val}
//                       type="button"
//                       onClick={() => setRating(val)}
//                       className={cn(
//                         "p-2 rounded-md border",
//                         val <= rating ? "bg-yellow-400 text-white" : ""
//                       )}
//                     >
//                       <Star className="w-4 h-4" />
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* COMMENT */}
//             <div className="space-y-1">
//               <p className="text-sm font-medium">Description (optional)</p>
//               <Textarea
//                 value={comment}
//                 onChange={(e) => setComment(e.target.value)}
//                 placeholder="Write something..."
//               />
//             </div>

//             <DialogFooter>
//               <Button type="button" variant="outline" onClick={closeDialog}>
//                 Cancel
//               </Button>
//               <Button type="submit">Submit Review</Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </main>
//   );
// }







// Orders.tsx
import { FormEvent, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatPKR } from "@/lib/currency";
import { getDiscountForCollection, applyDiscount } from "@/data/discount";
import { getProduct } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

//
// Supabase Session Helpers
//
function getSupabaseSession() {
  const key = Object.keys(localStorage).find((k) => k.includes("-auth-token"));
  if (!key) return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return null;
  }
}

function getAccessToken() {
  return getSupabaseSession()?.access_token || null;
}

function getUserId() {
  return getSupabaseSession()?.user?.id || null;
}

//
// TYPES
//
interface ReviewTarget {
  orderId: number;
  productId: string;
  productName: string;
  size?: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  size?: string;
  price: number;
  discount: number;
  color?: string | null;
}

interface Order {
  order_id: number;
  user_id: string;
  username: string;
  status: string;
  total_products: number;
  total_price: number;
  products: OrderItem[];
  order_time: string;
}

//
// MAIN COMPONENT
//
export default function Orders() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ReviewTarget | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [reviewStatus, setReviewStatus] = useState<{ [key: string]: boolean }>({});
  const [paymentOpen, setPaymentOpen] = useState(false);


  const STATUS_STYLES: Record<string, { badge: string; border: string; card?: string }> = {
    pending: { badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-300", card: "bg-yellow-50" },
    processing: { badge: "bg-blue-100 text-blue-800", border: "border-blue-300", card: "bg-blue-50" },
    shipped: { badge: "bg-indigo-100 text-indigo-800", border: "border-indigo-300", card: "bg-indigo-50" },
    delivered: { badge: "bg-green-100 text-green-800", border: "border-green-300", card: "bg-green-50" },
    canceled: { badge: "bg-red-100 text-red-800", border: "border-red-300", card: "bg-red-50" },
  };

  //
  // FETCH ORDERS
  //
  useEffect(() => {
    const uid = getUserId();
    const token = getAccessToken();

    async function loadOrders() {
      try {
        if (!uid || !token) {
          setOrders([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/users/${uid}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setOrders([]);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to load orders`);
        }

        const data: Order[] = await response.json();
        setOrders(data);

        // --- PARALLEL REVIEW CHECKS (big speed improvement) ---
        const statusMap: Record<string, boolean> = {};
        const checks: Promise<void>[] = [];

        for (const order of data) {
          for (const item of order.products) {
            const key = `${order.order_id}-${item.product_id}-${item.size ?? ""}`;
            const p = hasReviewForItem(uid as string, order.order_id, item.product_id, item.size)
              .then((res) => {
                statusMap[key] = !!res;
              })
              .catch(() => {
                statusMap[key] = false;
              });
            checks.push(p);
          }
        }

        await Promise.all(checks);
        setReviewStatus(statusMap);

      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [refreshToken]);

  //
  // CHECK REVIEW
  //
  async function hasReviewForItem(
    uid: string,
    orderId: number,
    productId: string,
    size?: string
  ) {
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}/reviews/check?user_id=${uid}&order_id=${orderId}&product_id=${productId}${size ? `&size=${size}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return false;
      const data = await res.json();
      return data.reviewed;
    } catch {
      return false;
    }
  }

  //
  // OPEN DIALOG
  //
  function openDialog(target: ReviewTarget) {
    setActiveTarget(target);
    setRating(5);
    setComment("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setActiveTarget(null);
  }

  //
  // SUBMIT REVIEW
  //
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!activeTarget) return;

    const uid = getUserId();
    const token = getAccessToken();

    const reviewData = {
      user_id: uid,
      product_id: activeTarget.productId,
      stars: rating,
      text: comment || "",
      time: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });

      if (!res.ok) {
        console.error(await res.text());
        throw new Error("Failed to submit review");
      }

      const key = `${activeTarget.orderId}-${activeTarget.productId}-${activeTarget.size ?? ""}`;
      setReviewStatus((prev) => ({ ...prev, [key]: true }));

      setRefreshToken((p) => p + 1);
      closeDialog();
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    }
  }

  //
  // RENDER
  //
  if (!user) return <div className="container py-10">Please login to view your orders.</div>;
  if (loading) return <div className="container py-10">Loading orders...</div>;

  return (
    <main className="container py-10">
      <h1 className="font-serif text-3xl">My Orders</h1>


      {/* PAYMENT ICON BUTTON */}
      <div className="mt-4">
        <Button 
          variant="default"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setPaymentOpen(true)}
        >
          💳 Payment Details
        </Button>
      </div>


      {orders.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-5">
          {[...orders]
            .sort((a, b) => b.order_id - a.order_id) // DESCENDING ORDER
            .map((o) => (
            <div
              key={o.order_id}
              className={`border rounded-lg p-4 space-y-4 ${STATUS_STYLES[o.status]?.card ?? ""}`}
            >
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Order #{o.order_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.order_time).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[o.status]?.badge}`}
                >
                  {o.status}
                </span>
              </div>

              {/* PRODUCT LIST */}
              <ul className="space-y-3">
                {o.products.map((item, idx) => {
                  const prod = getProduct(item.product_id);

                  const qty = item.quantity || 1;
                  // Backend already gives line price, so backend unit price:
                  const backendUnit = Number(item.price) / qty;
                  
                  // Use backend discount (percentage)
                  const pct = item.discount || 0;
                  
                  // Apply discount
                  const discountedUnit = applyDiscount(backendUnit, pct);
                  
                  // Final line price
                  const line = Math.round(discountedUnit * qty);

                  const key = `${o.order_id}-${item.product_id}-${item.size ?? ""}`;
                  const reviewed = reviewStatus[key];

                  return (
                    <li
                      key={`${key}-${idx}`} // make unique by including order + index
                      className="flex flex-col md:flex-row items-start md:items-center justify-between border p-3 rounded-md"
                    >
                      <div className="flex gap-3">
                        {/* IMAGE */}
                        <img
                          src={prod?.image || "/placeholder.svg"}
                          className="w-16 h-16 rounded-md border object-cover"
                        />

                        <div>
                          <p className="font-medium">{item.product_name}</p>

                          {prod?.collection && (
                            <p className="text-xs text-muted-foreground">
                              Collection: {prod.collection}
                            </p>
                          )}

                          {item.color && (
                            <p className="text-xs text-muted-foreground">
                              Color: {item.color}
                            </p>
                          )}

                          <p className="text-xs">
                            {item.size ? `Size: ${item.size} — ` : ""}
                            Qty: {item.quantity}
                          </p>

                          <p className="text-xs font-semibold">
                            {formatPKR(discountedUnit)} × {item.quantity} = {formatPKR(line)}
                          </p>
                          
                          {pct > 0 && (
                            <p className="text-xs line-through text-muted-foreground">
                              {formatPKR(backendUnit)}
                            </p>
                          )}
                        </div>
                      </div>

                      {reviewed ? (
                        <Button variant="secondary" disabled size="sm">
                          Review submitted
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            openDialog({
                              orderId: o.order_id,
                              productId: item.product_id,
                              productName: item.product_name,
                              size: item.size,
                            })
                          }
                        >
                          Give Review
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* DELIVERY CHARGE DISPLAY */}
              <div className="text-sm font-medium mt-2">
                {(() => {
                  const totalQty = o.products.reduce((s, i) => s + i.quantity, 0);
                  const sub = o.products.reduce((s, i) => {
                    const qty = i.quantity || 1;
                    const backendUnit = Number(i.price) / qty;
                    const discountedUnit = i.discount
                      ? backendUnit - (backendUnit * i.discount) / 100
                      : backendUnit;
                    return s + discountedUnit * qty;
                  }, 0);
              
                  const dc = (sub >= 5000 || totalQty >= 3) ? 0 : 200;
              
                  return (
                    <p className="text-muted-foreground">
                      Delivery Charge: {dc === 0 ? "Free" : `Rs ${dc}`}
                    </p>
                  );
                })()}
              </div>



            </div>
          ))}
        </div>
      )}

      {/* REVIEW DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(v) => (v ? setDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Review {activeTarget?.productName}</DialogTitle>
              <DialogDescription>Share your experience.</DialogDescription>
            </DialogHeader>

            {/* RATING */}
            <div>
              <p className="text-sm font-medium mb-1">Rating</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const val = idx + 1;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className={cn(
                        "p-2 rounded-md border",
                        val <= rating ? "bg-yellow-400 text-white" : ""
                      )}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMMENT */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Description (optional)</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write something..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">Submit Review</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* PAYMENT DETAILS POPUP */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Payment Instructions</DialogTitle>
            <DialogDescription>
              Please complete your payment using the details below.
            </DialogDescription>
          </DialogHeader>
      
          <div className="space-y-4 text-sm">
      
            <div className="p-3 rounded-md bg-purple-50 border border-purple-200">
              <p className="font-medium text-purple-700">📱 JazzCash</p>
              <p className="mt-1 text-purple-900 text-base">03240405762 (MARIYEM NABEEL)</p>
            </div>
      
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <p className="font-medium text-green-700">🏦 Bank AL Habib</p>
              <p className="mt-1 text-green-900">
                PK03BAHL5509008101070301 (Maryam Nabeel)
              </p>
            </div>
      
            <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
              <p className="font-medium text-yellow-700">📩 Email Payment Proof</p>
              <p className="mt-1">rangistaarttowear@gmail.com</p>
            </div>
      
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
              <p className="font-medium text-blue-700">📲 WhatsApp Screenshot</p>
              <p className="mt-1">Send us a screenshot on WhatsApp after payment.</p>
            </div>
      
            <p className="text-sm text-muted-foreground">
              Once you send us proof, your order status will be updated within <strong>1 hour</strong>.
            </p>
          </div>
      
          <DialogFooter>
            <Button onClick={() => setPaymentOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </main>
  );
}
