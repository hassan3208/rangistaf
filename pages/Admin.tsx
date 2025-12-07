// src/pages/Admin.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import type { CartItem } from "@/context/CartContext";
import { listAllUsers, StoredUser } from "@/data/users";
import { readUserCart } from "@/data/carts";
import { API_BASE_URL } from "@/lib/api-config";
import { formatPKR } from "@/lib/currency";
import { getDiscountForCollection, applyDiscount } from "@/data/discount";
import { getProducts, getProduct } from "@/data/catalog";

import { X, Plus, Trash2, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const COLLECTIONS = [
  "✨ Bestsellers Edit",
  "🌸 New Arrivals",
  "❄ Winter Wonders",
  "☀ Summer Bloom",
  "💍 The Wedding Season",
  "🌙 Eid Collection",
  "🐐 Bakra Eid Edit",
  "Azadi Collection",
  "👩‍🍼 Mommy & Me",
  "👗 Adults Collection",
  "🎨 Handpainted Dupattas Collection",
] as const;

const ALLOWED_ADMIN_EMAILS = new Set(
  (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || "")
    .split(",")
    .map((email: string) => email.trim())
    .filter((email: string) => email)
);

type TabKey = "orders" | "users" | "add" | "edit" | "delete" | "products";

interface ProductFormData {
  id: string;
  name: string;
  image: string;
  images: string[];
  collection: string;
  category: string;
  description: string;
  colors: string[];
  discount: string;
  XS_price: string;
  S_price: string;
  M_price: string;
  L_price: string;
  XL_price: string;
  XXL_price: string;
  XS_stock: string;
  S_stock: string;
  M_stock: string;
  L_stock: string;
  XL_stock: string;
  XXL_stock: string;
  kids: boolean;
}

interface OrderProduct {
  product_name: string;
  quantity: number;
  size: string;
  color?: string | null;
  price: number;
  product_id: string;
  discount: number;
}

interface Order {
  order_id: number;
  user_id: string | number;
  username: string;
  status: string;
  total_products: number;
  total_price: number;
  products: OrderProduct[];
  order_time: string;
}

/* -------------------------- ALL HOOKS DECLARED FIRST -------------------------- */

export default function Admin() {
  // auth
  const { user } = useAuth();

  // Supabase session helpers (always defined)
  function getSupabaseSession() {
    const key = Object.keys(localStorage).find((k) => k.includes("-auth-token"));
    if (!key) return null;
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return null;
    }
  }
  function getSupabaseToken() {
    return getSupabaseSession()?.access_token || null;
  }
  function getSupabaseUserId() {
    return getSupabaseSession()?.user?.id || null;
  }

  // UI state (declare all hooks here to avoid conditional-hook errors)
  const [tab, setTab] = useState<TabKey>("orders");
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [userSearch, setUserSearch] = useState("");


  const [users, setUsers] = useState<StoredUser[]>([]);
  const [userCarts, setUserCarts] = useState<Record<string, CartItem[]>>({});

  // confirmation dialog for status change
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // product management UI state
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [productIdInput, setProductIdInput] = useState("");
  const [productForm, setProductForm] = useState<ProductFormData>(() => defaultProductForm());
  const [loadingProduct, setLoadingProduct] = useState(false);

  // products list
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // reviewStatus map (optional usage)
  const [reviewStatus, setReviewStatus] = useState<Record<string, boolean>>({});

  // status styles
  const STATUS_STYLES: Record<string, { badge: string; border: string; card?: string }> = {
    pending: { badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-300", card: "bg-yellow-50" },
    processing: { badge: "bg-blue-100 text-blue-800", border: "border-blue-300", card: "bg-blue-50" },
    shipped: { badge: "bg-indigo-100 text-indigo-800", border: "border-indigo-300", card: "bg-indigo-50" },
    delivered: { badge: "bg-green-100 text-green-800", border: "border-green-300", card: "bg-green-50" },
    canceled: { badge: "bg-red-100 text-red-800", border: "border-red-300", card: "bg-red-50" },
  };

  /* -------------------------- HELPERS & CALLBACKS -------------------------- */

  // reset form helper
  function defaultProductForm(): ProductFormData {
    return {
      id: "",
      name: "",
      image: "",
      images: [],
      collection: "",
      category: "hp",
      description: "",
      colors: [],
      discount: "0",
      XS_price: "",
      S_price: "",
      M_price: "",
      L_price: "",
      XL_price: "",
      XXL_price: "",
      XS_stock: "",
      S_stock: "",
      M_stock: "",
      L_stock: "",
      XL_stock: "",
      XXL_stock: "",
      kids: false,
    };
  }

  // small update helper
  const updateProductField = (field: keyof ProductFormData, value: any) => {
    setProductForm((p) => ({ ...p, [field]: value }));
  };

  const addImageSlot = () => setProductForm((p) => ({ ...p, images: [...p.images, ""] }));
  const updateImageAt = (idx: number, val: string) =>
    setProductForm((p) => ({ ...p, images: p.images.map((im, i) => (i === idx ? val : im)) }));
  const removeImageAt = (idx: number) =>
    setProductForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // load user carts from local data
  const loadUserCarts = useCallback((list: StoredUser[]) => {
    const mapped: Record<string, CartItem[]> = {};
    for (const u of list) {
      mapped[u.id] = readUserCart(u.id);
    }
    setUserCarts(mapped);
  }, []);

  const loadUsersAndCarts = useCallback(async () => {
    try {
      const list = await listAllUsers();
      setUsers(list);
      loadUserCarts(list);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }, [loadUserCarts]);

  // products/fetch helpers
  const fetchAllProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setAllProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
      setAllProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // fetch orders - per your backend: no auth required for GET /orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        console.error("Orders fetch failed", response.status, await response.text().catch(() => ""));
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      const data: Order[] = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // change order status (PUT /orders/{order_id}/status) - protected
  const changeOrderStatus = useCallback(async (orderId: number, newStatus: string) => {
    try {
      const token = getSupabaseToken();
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Failed to update status: ${response.status} ${text}`);
      }
      await fetchOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status. See console for details.");
    }
  }, [fetchOrders]);

  // delete product
  const handleDeleteProduct = useCallback(async (id: string) => {
    if (!id || !id.trim()) return alert("Enter product id");
    try {
      const token = getSupabaseToken();
      const res = await fetch(`${API_BASE_URL}/products/${id.trim()}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 404) {
        alert("Product not found.");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to delete: ${res.status} ${text}`);
      }

      alert("Product deleted.");
      setDeleteProductOpen(false);
      setProductIdInput("");
      fetchAllProducts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }, [fetchAllProducts]);

  // add product (POST /products)
  const handleAddProduct = useCallback(async () => {
    try {
      setLoadingProduct(true);
      if (!productForm.id.trim() || !productForm.name.trim() || !productForm.image.trim() || !productForm.collection.trim()) {
        alert("Please fill required fields: id, name, image, collection");
        setLoadingProduct(false);
        return;
      }

      const payload = {
        id: productForm.id.trim(),
        name: productForm.name.trim(),
        image: productForm.image.trim(),
        images: productForm.images && productForm.images.length ? productForm.images.filter(Boolean) : [],
        collection: productForm.collection.trim(),
        description: productForm.description || "",
        category: productForm.category || "hp",
        colors: (productForm.colors && productForm.colors.length) ? productForm.colors : [],
        discount: productForm.discount ? Number(productForm.discount) : 0,

        XS_price: Number(productForm.XS_price) || 0,
        S_price: Number(productForm.S_price) || 0,
        M_price: Number(productForm.M_price) || 0,
        L_price: Number(productForm.L_price) || 0,
        XL_price: Number(productForm.XL_price) || 0,
        XXL_price: Number(productForm.XXL_price) || 0,

        XS_stock: Number(productForm.XS_stock) || 0,
        S_stock: Number(productForm.S_stock) || 0,
        M_stock: Number(productForm.M_stock) || 0,
        L_stock: Number(productForm.L_stock) || 0,
        XL_stock: Number(productForm.XL_stock) || 0,
        XXL_stock: Number(productForm.XXL_stock) || 0,

        kids: Boolean(productForm.kids),
      };

      const token = getSupabaseToken();

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMsg = `Failed to add product: ${response.statusText}`;
        try {
          const json = await response.json();
          errMsg = json.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      alert("Product added successfully!");
      setProductForm(defaultProductForm());
      setAddProductOpen(false);
      fetchAllProducts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setLoadingProduct(false);
    }
  }, [productForm, fetchAllProducts]);

  // load a product into form for edit
  const handleLoadProductForEdit = useCallback(async (id: string) => {
    if (!id || !id.trim()) return alert("Enter product id");
    try {
      const res = await fetch(`${API_BASE_URL}/product/${id.trim()}`);
      if (!res.ok) {
        alert("Product not found");
        return;
      }
      const data = await res.json();
      setProductForm({
        id: data.id ?? "",
        name: data.name ?? "",
        image: data.image ?? "",
        images: data.images ?? [],
        collection: data.collection ?? "",
        category: data.category ?? "hp",
        description: data.description ?? "",
        colors: Array.isArray(data.colors) ? data.colors : data.colors ? String(data.colors).split(",") : [],
        discount: data.discount != null ? String(data.discount) : "0",
        XS_price: (data.XS_price ?? "") + "",
        S_price: (data.S_price ?? "") + "",
        M_price: (data.M_price ?? "") + "",
        L_price: (data.L_price ?? "") + "",
        XL_price: (data.XL_price ?? "") + "",
        XXL_price: (data.XXL_price ?? "") + "",
        XS_stock: (data.XS_stock ?? "") + "",
        S_stock: (data.S_stock ?? "") + "",
        M_stock: (data.M_stock ?? "") + "",
        L_stock: (data.L_stock ?? "") + "",
        XL_stock: (data.XL_stock ?? "") + "",
        XXL_stock: (data.XXL_stock ?? "") + "",
        kids: !!data.kids,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load product");
    }
  }, []);

  // save edited product (PUT /products/{id})
  const handleSaveEditedProduct = useCallback(async () => {
    if (!productForm.id) return alert("No product loaded to save");
    try {
      const token = getSupabaseToken();

      const payload = {
        id: productForm.id.trim(),
        name: productForm.name.trim(),
        image: productForm.image.trim(),
        images: productForm.images && productForm.images.length ? productForm.images.filter(Boolean) : [],
        collection: productForm.collection.trim(),
        description: productForm.description || "",
        category: productForm.category || "hp",
        colors: (productForm.colors && productForm.colors.length) ? productForm.colors : [],
        discount: productForm.discount ? Number(productForm.discount) : 0,

        XS_price: Number(productForm.XS_price) || 0,
        S_price: Number(productForm.S_price) || 0,
        M_price: Number(productForm.M_price) || 0,
        L_price: Number(productForm.L_price) || 0,
        XL_price: Number(productForm.XL_price) || 0,
        XXL_price: Number(productForm.XXL_price) || 0,

        XS_stock: Number(productForm.XS_stock) || 0,
        S_stock: Number(productForm.S_stock) || 0,
        M_stock: Number(productForm.M_stock) || 0,
        L_stock: Number(productForm.L_stock) || 0,
        XL_stock: Number(productForm.XL_stock) || 0,
        XXL_stock: Number(productForm.XXL_stock) || 0,

        kids: Boolean(productForm.kids),
      };

      const res = await fetch(`${API_BASE_URL}/products/${productForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMsg = `Failed to update product: ${res.statusText}`;
        try {
          const payload = await res.json();
          errMsg = payload.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      alert("Product updated successfully");
      setEditProductOpen(false);
      setProductForm(defaultProductForm());
      fetchAllProducts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Update failed");
    }
  }, [productForm, fetchAllProducts]);

  // helper: compute productsById (merges local catalog and fetched products)
  const productsById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of getProducts()) map[p.id] = p;
    for (const p of allProducts) if (p?.id) map[p.id] = p;
    return map;
  }, [allProducts]);

  // open tab helper
  const openTab = (t: TabKey) => setTab(t);

  /* -------------------------- EFFECTS: run after hooks -------------------------- */

  // initial load
  useEffect(() => {
    fetchOrders();
    loadUsersAndCarts();
    fetchAllProducts();
  }, [fetchAllProducts, fetchOrders, loadUsersAndCarts]);

  // cart:change listener
  useEffect(() => {
    const handleCartChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail;
      if (detail?.userId) {
        setUserCarts((prev) => ({ ...prev, [detail.userId]: readUserCart(detail.userId) }));
      } else {
        loadUsersAndCarts();
      }
    };
    window.addEventListener("cart:change", handleCartChange);
    return () => window.removeEventListener("cart:change", handleCartChange);
  }, [loadUsersAndCarts]);

  /* -------------------------- EARLY RETURNS (after hooks) -------------------------- */

  if (!user) return <div className="container py-10">Please login to access admin.</div>;
  if (!ALLOWED_ADMIN_EMAILS.has(user.email)) return <div className="container py-10">You are not authorized to access admin.</div>;
  if (!unlocked) {
    return (
      <main className="container py-10 space-y-4">
        <h1 className="font-serif text-3xl">Admin Access</h1>
        <p className="text-sm text-muted-foreground">Enter admin password to continue.</p>
        <div className="flex items-center gap-2">
          <Input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-48"
          />
          <Button
            onClick={() => {
              if (pass.trim() === import.meta.env.VITE_ADMIN_PASSWORD) setUnlocked(true);
              else alert("Incorrect password");
            }}
          >
            Enter
          </Button>
        </div>
      </main>
    );
  }

  /* -------------------------- RENDER UI -------------------------- */

  return (
    <main className="container py-10 space-y-6">
      {/* HEADER + TAB NAV */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Admin Panel — Pro</h1>

        <div className="flex gap-2 items-center">
          <nav className="flex gap-1 rounded-md bg-muted p-1">
            <TabButton active={tab === "orders"} onClick={() => openTab("orders")}>Orders</TabButton>
            <TabButton active={tab === "users"} onClick={() => openTab("users")}>Users & Carts</TabButton>
            <TabButton active={tab === "add"} onClick={() => { setAddProductOpen(true); openTab("add"); }}>Add Product</TabButton>
            <TabButton active={tab === "edit"} onClick={() => { setEditProductOpen(true); openTab("edit"); }}>Edit Product</TabButton>
            <TabButton active={tab === "delete"} onClick={() => { setDeleteProductOpen(true); openTab("delete"); }}>Delete Product</TabButton>
            <TabButton active={tab === "products"} onClick={() => openTab("products")}>Products</TabButton>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <section>
        {tab === "orders" && (
          <>
            <h2 className="font-serif text-2xl">Orders</h2>
            {loadingOrders ? (
              <p className="mt-4 text-muted-foreground">Loading orders...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((o) => (
                  <div
                    key={o.order_id}
                    className={`border rounded-lg p-4 space-y-3 ${STATUS_STYLES[o.status]?.border ?? "border-gray-200"} ${STATUS_STYLES[o.status]?.card ?? ""}`}
                  >
                    <div className="flex justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">Order #{o.order_id} · User {o.username}</span>
                        <span className="text-xs text-muted-foreground">{new Date(o.order_time).toLocaleString()}</span>
                        {(() => {
                          const computedTotal = o.products.reduce((s, item) => {
                            const qty = item.quantity || 1;
                            const prod = productsById[item.product_id] || getProducts().find(p => p.name.toLowerCase() === String(item.product_name).toLowerCase());
                            const pct = prod ? getDiscountForCollection(prod.collection) : 0;
                            const unit = qty > 0 ? Number(item.price) / qty : Number(item.price);
                            const discountedUnit = applyDiscount(unit, pct);
                            const line = Math.round(discountedUnit * qty);
                            return s + line;
                          }, 0);

                          if (o.status === "pending") return <span className="text-xs text-muted-foreground">Total: {formatPKR(computedTotal)}</span>;
                          if (o.status === "canceled") return <span className="text-xs text-muted-foreground">Canceled (Original Total: {formatPKR(o.total_price)})</span>;
                          if (o.status === "delivered") return <span className="text-xs text-muted-foreground">Paid: {formatPKR(computedTotal)}</span>;
                          return <span className="text-xs text-muted-foreground">Paid: {formatPKR(Math.round(computedTotal * 0.5))} | Remaining: {formatPKR(Math.round(computedTotal * 0.5))}</span>;
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[o.status]?.badge ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {o.status}
                        </span>
                        <select
                          className={`rounded px-2 py-1 border ${STATUS_STYLES[o.status]?.border ?? "border-gray-300"}`}
                          value={o.status}
                          onChange={(e) => { setSelectedOrder(o); setNewStatus(e.target.value); setConfirmationOpen(true); }}
                        >
                          <option value="pending">pending</option>
                          <option value="processing">processing</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                          <option value="canceled">canceled</option>
                        </select>
                      </div>
                    </div>

                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {o.products.map((i) => {
                        const qty = i.quantity || 1;
                    
                        // --- DISCOUNT LOGIC (Frontend Calculation) ---
                        const originalUnit = qty > 0 ? Number(i.price) / qty : Number(i.price);
                        const pct = Number(i.discount || 0);      // <-- backend discount
                        const discountedUnit = pct > 0 
                          ? Math.round(originalUnit - (originalUnit * pct) / 100)
                          : originalUnit;
                    
                        const linePrice = discountedUnit * qty;
                    
                        return (
                          <li
                            key={i.product_id + i.size}
                            className="flex flex-wrap items-center gap-2 rounded border border-dashed p-2"
                          >
                            <span>
                              {i.product_name} 
                              {i.size && ` (${i.size})`}
                              {i.color && ` • ${i.color}`}       {/* ← SHOW COLOR IF AVAILABLE */}
                              × {i.quantity} — {formatPKR(linePrice)}
                            </span>
                    
                            {/* Show original price if discount exists */}
                            {pct > 0 && (
                              <span className="ml-2 text-xs text-red-500 line-through">
                                {formatPKR(i.price)}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    
                      {o.products.length === 0 && (
                        <li className="text-muted-foreground">No products in order.</li>
                      )}
                    </ul>

                  </div>
                ))}
                {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
              </div>
            )}
          </>
        )}

        {tab === "users" && (
          <>
            <h2 className="font-serif text-2xl">Users</h2>
        
            {/* SEARCH BAR */}
            <div className="mt-3 mb-4">
              <Input
                placeholder="Search by username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-72"
              />
            </div>
        
            <div className="mt-4 space-y-3">
              {users
                .filter((u) =>
                  (u.username || "").toLowerCase().includes(userSearch.toLowerCase())
                )
                .map((u) => {
                  const { id, ...cleanUser } = u;
        
                  return (
                    <div key={u.id} className="space-y-4 rounded-lg border p-4">
        
                      {/* USER INFO ONLY */}
                      <div className="space-y-1 text-sm">
                        {Object.entries(cleanUser).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {value ?? "—"}
                            </span>
                          </div>
                        ))}
                      </div>
        
                    </div>
                  );
                })}
        
              {/* NO MATCH FOUND */}
              {users.filter((u) =>
                (u.username || "").toLowerCase().includes(userSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-muted-foreground">No matching users.</p>
              )}
            </div>
          </>
        )}


        {tab === "add" && (
          <>
            <h2 className="font-serif text-2xl">Add Product</h2>
            <p className="text-sm text-muted-foreground">Add a new product to the catalog. Required: id, name, image, collection.</p>
        
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product ID *</Label>
                <Input value={productForm.id} onChange={(e) => updateProductField("id", e.target.value)} />
        
                <Label>Product Name *</Label>
                <Input value={productForm.name} onChange={(e) => updateProductField("name", e.target.value)} />
        
                <Label>Primary Image URL *</Label>
                <Input value={productForm.image} onChange={(e) => updateProductField("image", e.target.value)} />
        
                <Label>Collection *</Label>
                <Select value={productForm.collection} onValueChange={(v) => updateProductField("collection", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLECTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
        
                <Label>Category</Label>
                <Input
                  value={productForm.category}
                  onChange={(e) => updateProductField("category", e.target.value)}
                  placeholder="HP"
                />
        
                {/* COLORS SECTION - ONE BY ONE */}
                <Label>Colors</Label>
                <div className="space-y-2">
                  {productForm.colors.map((c, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={c}
                        onChange={(e) =>
                          updateProductField(
                            "colors",
                            productForm.colors.map((x, i) => (i === idx ? e.target.value : x))
                          )
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateProductField(
                            "colors",
                            productForm.colors.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateProductField("colors", [...productForm.colors, ""])
                    }
                  >
                    <Plus className="w-3 h-3" /> Add Color
                  </Button>
                </div>
        
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  value={productForm.discount}
                  onChange={(e) => updateProductField("discount", e.target.value)}
                />
              </div>
        
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => updateProductField("description", e.target.value)}
                  rows={4}
                />
        
                <Label>Additional Images</Label>
                <div className="space-y-2">
                  {productForm.images.map((img, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={img} onChange={(e) => updateImageAt(idx, e.target.value)} />
                      <Button variant="outline" size="sm" onClick={() => removeImageAt(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addImageSlot}>
                    <Plus className="w-3 h-3" /> Add Image
                  </Button>
                </div>
        
                <Label>Prices (PKR)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["XS", "S", "M", "L", "XL", "XXL"] as const).map((sz) => (
                    <Input
                      key={sz}
                      type="number"
                      placeholder={`${sz} price`}
                      value={productForm[`${sz}_price`]}
                      onChange={(e) =>
                        updateProductField(`${sz}_price`, e.target.value)
                      }
                    />
                  ))}
                </div>
        
                <Label>Stock (Qty)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["XS", "S", "M", "L", "XL", "XXL"] as const).map((sz) => (
                    <Input
                      key={sz}
                      type="number"
                      placeholder={`${sz} stock`}
                      value={productForm[`${sz}_stock`] || "30"} // Default stock 30
                      onChange={(e) =>
                        updateProductField(`${sz}_stock`, e.target.value)
                      }
                    />
                  ))}
                </div>
        
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={productForm.kids}
                    onCheckedChange={(v) => updateProductField("kids", !!v)}
                  />
                  <Label>Kids product</Label>
                </div>
        
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddProduct} disabled={loadingProduct}>
                    {loadingProduct ? "Adding..." : "Add Product"}
                  </Button>
                  <Button variant="outline" onClick={() => setProductForm(defaultProductForm())}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}


        {tab === "edit" && (
          <>
            <h2 className="font-serif text-2xl">Edit Product</h2>
            <p className="text-sm text-muted-foreground">
              Enter product ID to load and edit. All fields editable.
            </p>
        
            <div className="mt-4 flex gap-2">
              <Input
                value={productIdInput}
                placeholder="Product ID"
                onChange={(e) => setProductIdInput(e.target.value)}
              />
              <Button onClick={() => handleLoadProductForEdit(productIdInput)}>
                Load
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setProductForm(defaultProductForm());
                  setProductIdInput("");
                }}
              >
                Clear
              </Button>
            </div>
        
            {productForm.id && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Editing ID</Label>
                  <Input value={productForm.id} disabled />
        
                  <Label>Product Name</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => updateProductField("name", e.target.value)}
                  />
        
                  <Label>Primary Image</Label>
                  <Input
                    value={productForm.image}
                    onChange={(e) => updateProductField("image", e.target.value)}
                  />
        
                  <Label>Collection</Label>
                  <Input
                    value={productForm.collection}
                    onChange={(e) => updateProductField("collection", e.target.value)}
                  />
        
                  <Label>Category</Label>
                  <Input
                    value={productForm.category}
                    onChange={(e) => updateProductField("category", e.target.value)}
                  />
        
                  {/* COLORS SECTION - ONE BY ONE */}
                  <Label>Colors</Label>
                  <div className="space-y-2">
                    {productForm.colors.map((c, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={c}
                          onChange={(e) =>
                            updateProductField(
                              "colors",
                              productForm.colors.map((x, i) =>
                                i === idx ? e.target.value : x
                              )
                            )
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateProductField(
                              "colors",
                              productForm.colors.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateProductField("colors", [...productForm.colors, ""])
                      }
                    >
                      <Plus className="w-3 h-3" /> Add Color
                    </Button>
                  </div>
                </div>
        
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => updateProductField("description", e.target.value)}
                    rows={4}
                  />
        
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={productForm.discount}
                    onChange={(e) => updateProductField("discount", e.target.value)}
                  />
        
                  <Label>Images</Label>
                  <div className="space-y-2">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={img}
                          onChange={(e) => updateImageAt(idx, e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeImageAt(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addImageSlot}>
                      <Plus className="w-3 h-3" /> Add Image
                    </Button>
                  </div>
        
                  <Label>Prices</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["XS", "S", "M", "L", "XL", "XXL"] as const).map((sz) => (
                      <Input
                        key={sz}
                        type="number"
                        value={productForm[`${sz}_price`]}
                        onChange={(e) =>
                          updateProductField(`${sz}_price`, e.target.value)
                        }
                      />
                    ))}
                  </div>
        
                  <Label>Stocks</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["XS", "S", "M", "L", "XL", "XXL"] as const).map((sz) => (
                      <Input
                        key={sz}
                        type="number"
                        value={productForm[`${sz}_stock`] || "30"} // Default 30
                        onChange={(e) =>
                          updateProductField(`${sz}_stock`, e.target.value)
                        }
                      />
                    ))}
                  </div>
        
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveEditedProduct}>Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductForm(defaultProductForm());
                        setProductIdInput("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}


        {tab === "delete" && (
          <>
            <h2 className="font-serif text-2xl">Delete Product</h2>
            <p className="text-sm text-muted-foreground">Enter product ID to delete. If not present, you'll get a friendly message.</p>

            <div className="mt-4 flex gap-2">
              <Input value={productIdInput} placeholder="Product ID" onChange={(e) => setProductIdInput(e.target.value)} />
              <Button variant="destructive" onClick={() => handleDeleteProduct(productIdInput)}>Delete</Button>
              <Button variant="outline" onClick={() => setProductIdInput("")}>Clear</Button>
            </div>
          </>
        )}

        {tab === "products" && (
          <>
            <h2 className="font-serif text-2xl">Products</h2>
            {loadingProducts ? <p>Loading products...</p> : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProducts.map((p: any) => (
                  <div key={p.id} className="border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.collection}</div>
                        <div className="text-xs text-muted-foreground">Category: {p.category ?? "hp"}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div>Prices: XS {formatPKR(p.XS_price)} · S {formatPKR(p.S_price)} · M {formatPKR(p.M_price)}</div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => { setEditProductOpen(true); setTab("edit"); setProductIdInput(p.id); setTimeout(() => handleLoadProductForEdit(p.id), 200); }}><Edit3 className="w-4 h-4" /> Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete ${p.name}?`)) handleDeleteProduct(p.id); }}><Trash2 className="w-4 h-4" /> Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change {selectedOrder?.username}'s status from{" "}
              {selectedOrder?.status} to {newStatus}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmationOpen(false); setSelectedOrder(null); setNewStatus(""); }}>Cancel</Button>
            <Button onClick={() => { if (selectedOrder && newStatus) { changeOrderStatus(selectedOrder.order_id, newStatus); } setConfirmationOpen(false); setSelectedOrder(null); setNewStatus(""); }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit product modal (reusable) */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Load by ID, edit fields and save.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2 items-center">
              <Input placeholder="Product ID" value={productIdInput} onChange={(e) => setProductIdInput(e.target.value)} />
              <Button onClick={() => handleLoadProductForEdit(productIdInput)}>Load</Button>
              <Button variant="outline" onClick={() => { setProductForm(defaultProductForm()); setProductIdInput(""); }}>Clear</Button>
            </div>

            {productForm.id && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product ID</Label>
                    <Input value={productForm.id} disabled />
                    <Label>Name</Label>
                    <Input value={productForm.name} onChange={(e) => updateProductField("name", e.target.value)} />
                    <Label>Primary Image</Label>
                    <Input value={productForm.image} onChange={(e) => updateProductField("image", e.target.value)} />
                    <Label>Collection</Label>
                    <Input value={productForm.collection} onChange={(e) => updateProductField("collection", e.target.value)} />
                    <Label>Category</Label>
                    <Input value={productForm.category} onChange={(e) => updateProductField("category", e.target.value)} />
                    <Label>Colors (comma separated)</Label>
                    <Input value={productForm.colors.join(", ")} onChange={(e) => updateProductField("colors", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={productForm.description} onChange={(e) => updateProductField("description", e.target.value)} rows={4} />
                    <Label>Discount (%)</Label>
                    <Input type="number" value={productForm.discount} onChange={(e) => updateProductField("discount", e.target.value)} />
                    <Label>Images</Label>
                    <div className="space-y-2">
                      {productForm.images.map((img, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input value={img} onChange={(e) => updateImageAt(idx, e.target.value)} />
                          <Button variant="outline" size="sm" onClick={() => removeImageAt(idx)}><X className="w-4 h-4" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addImageSlot}><Plus className="w-3 h-3" /> Add Image</Button>
                    </div>

                    <Label>Prices</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["XS","S","M","L","XL","XXL"] as const).map(sz => (
                        <Input key={sz+"pe"} value={productForm[`${sz}_price` as keyof ProductFormData] as string} onChange={(e) => updateProductField(`${sz}_price` as keyof ProductFormData, e.target.value)} />
                      ))}
                    </div>

                    <Label>Stocks</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["XS","S","M","L","XL","XXL"] as const).map(sz => (
                        <Input key={sz+"st2"} value={productForm[`${sz}_stock` as keyof ProductFormData] as string} onChange={(e) => updateProductField(`${sz}_stock` as keyof ProductFormData, e.target.value)} />
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveEditedProduct}>Save Changes</Button>
                      <Button variant="outline" onClick={() => { setProductForm(defaultProductForm()); setProductIdInput(""); setEditProductOpen(false); }}>Close</Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete product modal */}
      <Dialog open={deleteProductOpen} onOpenChange={setDeleteProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Enter product ID to delete it from catalog.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Input placeholder="Product ID" value={productIdInput} onChange={(e) => setProductIdInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProductIdInput(""); setDeleteProductOpen(false); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeleteProduct(productIdInput)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ----------------- Helper components ----------------- */

function TabButton({ active, onClick, children }: { active?: boolean; onClick?: () => void; children?: any }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded text-sm font-medium",
        active ? "bg-white shadow" : "text-muted-foreground hover:bg-muted/50"
      )}
    >
      {children}
    </button>
  );
}
