import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/currency";
import { useEffect, useState } from "react";
import { Star, StarHalf } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getStock } from "@/data/stock";
import { useFavorites } from "@/context/FavoritesContext";
import { listReviewsByProduct } from "@/data/reviews";
import type { Product } from "@/data/products";
import { SIZES } from "@/data/products";
import { API_BASE_URL } from "@/lib/api-config";
import { useAuth } from "@/context/AuthContext";
import { applyDiscount } from "@/data/discount";


function getSupabaseToken() {
  const key = Object.keys(localStorage).find(k => k.includes("-auth-token"));
  if (!key) return null;

  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return stored.access_token || null;
  } catch {
    return null;
  }
}





type SizeKey = (typeof SIZES)[number];

export default function ProductCard({
  id,
  name,
  image,
  collection,
  discount,
  colors,              // ⭐ NEW
  total_reviews,
  average_rating,
  XS_price,
  S_price,
  M_price,
  L_price,
  XL_price,
  XXL_price,
  XS_stock,
  S_stock,
  M_stock,
  L_stock,
  XL_stock,
  XXL_stock,
  kids,
}: Product) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const sizes: SizeKey[] = [...SIZES];
  const priceBySize: Record<SizeKey, number> = {
    XS: XS_price,
    S: S_price,
    M: M_price,
    L: L_price,
    XL: XL_price,
    XXL: XXL_price,
  };

  const stockBySize: Record<SizeKey, number> = {
    XS: XS_stock,
    S: S_stock,
    M: M_stock,
    L: L_stock,
    XL: XL_stock,
    XXL: XXL_stock,
  };

  const initialSize = sizes.find((s) => (stockBySize[s] ?? 0) > 0) ?? sizes[0] ?? null;

  const [size, setSize] = useState<SizeKey | null>(initialSize);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [stock, setStock] = useState<number>(initialSize ? getStock(id, initialSize) : 0);
  const [avgRating, setAvgRating] = useState<number>(average_rating);
  const [reviewCount, setReviewCount] = useState<number>(total_reviews);
  const [showCartEmoji, setShowCartEmoji] = useState<boolean>(false);
  const isFav = isFavorite(id);

  // ⭐ Auto-select first color
  useEffect(() => {
    if (selectedColor === null && colors && colors.length > 0) {
      setSelectedColor(colors[0]);
    }
  }, []);


  // Update stock when size changes
  useEffect(() => {
    if (size) {
      setStock(getStock(id, size));
    }
  }, [size, id]);

  // Update stars live
  useEffect(() => {
    const update = async () => {
      const list = await listReviewsByProduct(id);
      const count = list.length;
      const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
      setAvgRating(avg);
      setReviewCount(count);
    };
    update();
    window.addEventListener("reviews:change", update);
    return () => window.removeEventListener("reviews:change", update);
  }, [id]);

  const currentPrice = size ? priceBySize[size] : S_price;
  const discountPercent = discount ?? 0;
  const discountedPrice = discountPercent > 0 ? applyDiscount(currentPrice, discountPercent) : currentPrice;

  const add = async () => {
    const sizeToUse = size || initialSize;
    if (!sizeToUse) return;
  
    const token = getSupabaseToken();
    if (!token) {
      navigate("/login");
      return;
    }
  
    // Only call CartContext → it calls backend itself
    addItem(
      {
        id,
        name,
        price: discountedPrice,
        image,
        size: sizeToUse,
        collection,
        color: selectedColor ?? null,
      },
      1
    );
  };



  return (
    <div className="relative h-64 sm:h-72 rounded-lg overflow-hidden group">
      <Link to={`/product/${id}`}>
        <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      </Link>

      {/* Discount badge */}
      {discountPercent > 0 && (
        <div className="absolute left-2 top-2 z-20 rounded-sm bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground">
          -{discountPercent}%
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />

      <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-20">
        {/* Wishlist */}
        <div className="flex justify-end">
          <button
            aria-label="wishlist"
            onClick={() => toggleFavorite(id)}
            className={`text-2xl sm:text-3xl transition-transform hover:scale-110 drop-shadow-lg ${
              isFav ? "text-destructive" : "text-white"
            }`}
          >
            ♥
          </button>
        </div>

        {/* Bottom content */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              to={`/product/${id}`}
              className="font-medium text-sm sm:text-base hover:underline line-clamp-2 block text-white drop-shadow-lg"
            >
              {name}
            </Link>

            <div className="text-xs text-white/90 drop-shadow-lg mt-0.5 line-clamp-1">{collection}</div>

            {/* Kids tag */}
            {kids && (
              <div className="text-xs text-green-300 flex items-center gap-0.5 mt-0.5 drop-shadow-lg">✓ Kids</div>
            )}

            {/* ⭐ Color Options */}
            {colors && colors.length > 0 && (
              <div className="flex gap-1 mt-1">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(c);
                    }}
                    className={`px-2 py-1 rounded text-xs border ${
                      selectedColor === c
                        ? "bg-white text-black border-white"
                        : "bg-black/40 text-white border-white/40"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Stars */}
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-yellow-300">
              {(() => {
                const full = Math.floor(avgRating);
                const half = avgRating - full >= 0.5;
                return Array.from({ length: 5 }).map((_, i) => {
                  if (i < full) return <Star key={i} size={12} className="fill-yellow-300" />;
                  if (i === full && half) return <StarHalf key={i} size={12} className="fill-yellow-300" />;
                  return <Star key={i} size={12} className="opacity-40" />;
                });
              })()}
            </div>

            {/* Price */}
            <div className="mt-1 sm:mt-1.5">
              {discountPercent > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/70 line-through drop-shadow-lg">
                    {formatPKR(currentPrice)}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-yellow-300 drop-shadow-lg">
                    {formatPKR(discountedPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-sm sm:text-base font-bold text-white drop-shadow-lg">
                  {formatPKR(currentPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={add}
            disabled={!initialSize}
            className="text-3xl sm:text-4xl hover:scale-110 transition-transform flex-shrink-0 drop-shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add to cart"
          >
            🛒
          </button>
        </div>
      </div>

      {showCartEmoji && (
        <span
          className="absolute bottom-16 right-4 text-2xl"
          style={{
            animation: "spinAndFly 2s ease-out forwards",
            background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🛒
        </span>
      )}

      <style>
        {`
          @keyframes spinAndFly {
            0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
            50% { opacity: 1; transform: translateY(-150px) rotate(0deg) scale(1); }
            100% { opacity: 0; transform: translateY(-400px) rotate(720deg) scale(1.2); }
          }
        `}
      </style>
    </div>
  );
}
