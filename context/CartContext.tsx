// // CartContext.tsx
// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import { API_BASE_URL } from "@/lib/api-config";

// //
// // ---------------------------------------------------------
// // HELPERS → Read Supabase token & user ID from localStorage
// // ---------------------------------------------------------
// //
// function getSupabaseSession() {
//   const key = Object.keys(localStorage).find((k) =>
//     k.includes("-auth-token")
//   );
//   if (!key) return null;

//   try {
//     return JSON.parse(localStorage.getItem(key) || "{}");
//   } catch {
//     return null;
//   }
// }

// function getAccessToken() {
//   const session = getSupabaseSession();
//   return session?.access_token || null;
// }

// function getUserId() {
//   const session = getSupabaseSession();
//   return session?.user?.id || null;
// }

// //
// // ---------------------------------------------------------
// // CART TYPES
// // ---------------------------------------------------------
// //
// export type CartItem = {
//   id: string;
//   name: string;
//   image: string;
//   price: number;
//   qty: number;
//   size: string;
//   collection?: string;
//   color?: string | null;
//   discount?: number;
// };

// type CartContextType = {
//   items: CartItem[];
//   subtotal: number;
//   deliveryCharge: number;
//   total: number;
//   addItem: (item: Omit<CartItem, "qty">, qty?: number) => Promise<void>;
//   updateQty: (id: string, size: string, color: string | null, qty: number) => Promise<void>;
//   removeItem: (id: string, size: string, color: string | null) => Promise<void>;
//   refreshCart: () => Promise<void>;
// };

// const CartContext = createContext<CartContextType | undefined>(undefined);

// export function useCart() {
//   const ctx = useContext(CartContext);
//   if (!ctx) {
//     throw new Error("useCart must be inside CartProvider");
//   }
//   return ctx;
// }

// //
// // ---------------------------------------------------------
// // MAIN PROVIDER
// // ---------------------------------------------------------
// //
// export function CartProvider({ children }: { children: ReactNode }) {
//   const [items, setItems] = useState<CartItem[]>([]);
//   const [subtotal, setSubtotal] = useState(0);
//   const [deliveryCharge, setDeliveryCharge] = useState(300);
//   const [total, setTotal] = useState(0);

//   //
//   // FETCH CART FROM BACKEND
//   //
//   async function fetchCart() {
//     const userId = getUserId();
//     const token = getAccessToken();

//     if (!userId || !token) {
//       console.warn("No user logged in — cart empty");
//       setItems([]);
//       return;
//     }

//     try {
//       const res = await fetch(`${API_BASE_URL}/cart/${userId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.ok) {
//         console.error("Fetch cart failed:", res.status);
//         setItems([]);
//         return;
//       }

//       const data = await res.json();

//       const mapped: CartItem[] = data.items.map((item: any) => ({
//         id: item.product_id,
//         name: item.product_name,
//         image: item.image,
//         price: item.price,
//         qty: item.quantity,
//         size: item.size,
//         collection: item.collection,
//         color: item.color ?? null,
//         discount: item.discount ?? 0,
//       }));

//       setItems(mapped);
//     } catch (err) {
//       console.error("FETCH CART ERROR:", err);
//       setItems([]);
//     }
//   }

//   //
//   // ADD ITEM
//   //
//   async function addItem(item: Omit<CartItem, "qty">, qty: number = 1) {
//     const userId = getUserId();
//     const token = getAccessToken();

//     if (!userId || !token) {
//       alert("Please log in first.");
//       return;
//     }

//     try {
//       const body = {
//         user_id: userId,
//         product_id: item.id,
//         size: item.size,
//         quantity: qty,
//         color: item.color ?? null,
//       };

//       const res = await fetch(`${API_BASE_URL}/cart/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(body),
//       });

//       if (!res.ok) throw new Error("Add item failed");

//       await fetchCart();
//     } catch (err) {
//       console.error("ADD ITEM ERROR:", err);
//     }
//   }

//   //
//   // UPDATE QUANTITY
//   //
//   async function updateQty(id: string, size: string, color: string | null, qty: number) {
//     const userId = getUserId();
//     const token = getAccessToken();

//     if (!userId || !token) return;

//     try {
//       const res = await fetch(`${API_BASE_URL}/cart/update`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           user_id: userId,
//           product_id: id,
//           size,
//           color,
//           quantity: qty,
//         }),
//       });

//       if (!res.ok) throw new Error("Update qty failed");

//       await fetchCart();
//     } catch (err) {
//       console.error("UPDATE QTY ERROR:", err);
//     }
//   }

//   //
//   // REMOVE ITEM
//   //
//   async function removeItem(id: string, size: string, color: string | null) {
//     const userId = getUserId();
//     const token = getAccessToken();

//     if (!userId || !token) return;

//     try {
//       const res = await fetch(`${API_BASE_URL}/cart/remove`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           user_id: userId,
//           product_id: id,
//           size,
//           color,
//         }),
//       });

//       if (!res.ok) throw new Error("Remove failed");

//       await fetchCart();
//     } catch (err) {
//       console.error("REMOVE ERROR:", err);
//     }
//   }

//   //
//   // CALCULATE TOTALS
//   //
//   useEffect(() => {
//     const sub = items.reduce((sum, i) => {
//       // Calculate discounted price
//       const actualPrice =
//         i.discount && i.discount > 0
//           ? i.price - (i.price * i.discount) / 100
//           : i.price;
  
//       return sum + actualPrice * i.qty;
//     }, 0);
  
//     setSubtotal(sub);
  
//     const totalProducts = items.reduce((s, i) => s + i.qty, 0);
  
//     const dc = sub > 3000 || totalProducts >= 3 ? 0 : 300;
//     setDeliveryCharge(dc);
  
//     setTotal(sub + dc);
//   }, [items]);


//   //
//   // INITIAL LOAD
//   //
//   async function refreshCart() {
//     await fetchCart();
//   }

//   useEffect(() => {
//     refreshCart();
//   }, []);

//   return (
//     <CartContext.Provider
//       value={{
//         items,
//         subtotal,
//         deliveryCharge,
//         total,
//         addItem,
//         updateQty,
//         removeItem,
//         refreshCart,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// }











// CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api-config";

//
// ---------------------------------------------------------
// HELPERS → Read Supabase token & user ID from localStorage
// ---------------------------------------------------------
//
function getSupabaseSession() {
  const key = Object.keys(localStorage).find((k) =>
    k.includes("-auth-token")
  );
  if (!key) return null;

  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return null;
  }
}

function getAccessToken() {
  const session = getSupabaseSession();
  return session?.access_token || null;
}

function getUserId() {
  const session = getSupabaseSession();
  return session?.user?.id || null;
}

//
// ---------------------------------------------------------
// CART TYPES
// ---------------------------------------------------------
//
export type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  size: string;
  collection?: string;
  color?: string | null;
  discount?: number;
};

type CartContextType = {
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => Promise<void>;
  updateQty: (id: string, size: string, color: string | null, qty: number) => Promise<void>;
  removeItem: (id: string, size: string, color: string | null) => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be inside CartProvider");
  }
  return ctx;
}

//
// ---------------------------------------------------------
// MAIN PROVIDER
// ---------------------------------------------------------
//
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(300);
  const [total, setTotal] = useState(0);

  //
  // FETCH CART FROM BACKEND
  //
  async function fetchCart() {
    const userId = getUserId();
    const token = getAccessToken();

    if (!userId || !token) {
      console.warn("No user logged in — cart empty");
      setItems([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Treat 404 as "empty cart" (not an error)
        if (res.status === 404) {
          setItems([]);
          return;
        }
        // For other errors, log once and set empty cart (avoid noisy re-renders)
        console.error("Fetch cart failed:", res.status, await res.text().catch(() => ""));
        setItems([]);
        return;
      }

      const data = await res.json();

      const mapped: CartItem[] = (data.items || []).map((item: any) => ({
        id: item.product_id,
        name: item.product_name,
        image: item.image,
        price: item.price,
        qty: item.quantity,
        size: item.size,
        collection: item.collection,
        color: item.color ?? null,
        discount: item.discount ?? 0,
      }));

      setItems(mapped);
    } catch (err) {
      console.error("FETCH CART ERROR:", err);
      setItems([]);
    }
  }

  //
  // ADD ITEM
  //
  async function addItem(item: Omit<CartItem, "qty">, qty: number = 1) {
    const userId = getUserId();
    const token = getAccessToken();

    if (!userId || !token) {
      alert("Please log in first.");
      return;
    }

    try {
      const body = {
        user_id: userId,
        product_id: item.id,
        size: item.size,
        quantity: qty,
        color: item.color ?? null,
      };

      const res = await fetch(`${API_BASE_URL}/cart/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Add item failed");

      await fetchCart();
    } catch (err) {
      console.error("ADD ITEM ERROR:", err);
    }
  }

  //
  // UPDATE QUANTITY
  //
  async function updateQty(id: string, size: string, color: string | null, qty: number) {
    const userId = getUserId();
    const token = getAccessToken();

    if (!userId || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cart/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: id,
          size,
          color,
          quantity: qty,
        }),
      });

      if (!res.ok) throw new Error("Update qty failed");

      await fetchCart();
    } catch (err) {
      console.error("UPDATE QTY ERROR:", err);
    }
  }

  //
  // REMOVE ITEM
  //
  async function removeItem(id: string, size: string, color: string | null) {
    const userId = getUserId();
    const token = getAccessToken();

    if (!userId || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: id,
          size,
          color,
        }),
      });

      if (!res.ok) throw new Error("Remove failed");

      await fetchCart();
    } catch (err) {
      console.error("REMOVE ERROR:", err);
    }
  }

  //
  // CALCULATE TOTALS
  //
  useEffect(() => {
    const sub = items.reduce((sum, i) => {
      // Calculate discounted price
      const actualPrice =
        i.discount && i.discount > 0
          ? i.price - (i.price * i.discount) / 100
          : i.price;
  
      return sum + actualPrice * i.qty;
    }, 0);
  
    setSubtotal(sub);
  
    const totalProducts = items.reduce((s, i) => s + i.qty, 0);
  
    const dc = (totalProducts === 0 || sub >= 5000 || totalProducts >= 3) ? 0 : 200;
    setDeliveryCharge(dc);
  
    setTotal(sub + dc);
  }, [items]);


  //
  // INITIAL LOAD
  //
  async function refreshCart() {
    await fetchCart();
  }

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        deliveryCharge,
        total,
        addItem,
        updateQty,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
