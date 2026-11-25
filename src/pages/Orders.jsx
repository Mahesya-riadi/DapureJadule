import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

// ALAMAT API
const API_URL = "http://localhost/dapure-jadule-api/api/products.php";
const API_BASE_URL = "http://localhost/dapure-jadule-api";

// FORMAT RUPIAH
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(number) || 0);
}

// MENGUBAH PATH GAMBAR MENJADI URL
function getImageUrl(image) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `http://localhost${image}`;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
}

export default function Orders() {
  const { addToCart } = useCart();

  // STATE PRODUK
  const [products, setProducts] = useState([]);

  // STATE PENCARIAN
  const [searchTerm, setSearchTerm] = useState("");

  // STATE LOADING DAN ERROR
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // MENGAMBIL PRODUK DARI DATABASE
  const fetchProducts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Server gagal merespons permintaan.");
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Format data produk tidak sesuai.");
      }

      setProducts(result.data);
    } catch (error) {
      console.error("Gagal mengambil produk:", error);

      setErrorMessage(
        "Produk belum dapat dimuat. Pastikan Apache dan MySQL XAMPP aktif."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // MENJALANKAN API SAAT HALAMAN DIBUKA
  useEffect(() => {
    fetchProducts();
  }, []);

  // FILTER PRODUK BERDASARKAN PENCARIAN
  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.toLowerCase().trim();

    return (
      String(product.name || "").toLowerCase().includes(keyword) ||
      String(product.description || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-[#FFFDF8] text-[#35251D]">
      {/* JUDUL HALAMAN */}
      <section className="px-4 py-12 text-center sm:px-8">
        <p className="mb-2 font-semibold text-orange-700">Menu Favorit</p>

        <h1 className="text-3xl font-bold sm:text-4xl">
          Pilihan Pempek Kami
        </h1>

        <p className="mt-3 text-gray-600">
          Nikmati berbagai pilihan pempek khas Palembang.
        </p>
      </section>

      {/* DAFTAR PRODUK */}
      <section className="bg-[#FAF5EE] px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          {/* KOLOM PENCARIAN */}
          <div className="mx-auto mb-8 max-w-xl">
            <label
              htmlFor="search-product"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Cari produk favoritmu
            </label>

            <div className="relative">
              {/* IKON SEARCH */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>

              {/* INPUT PENCARIAN */}
              <input
                id="search-product"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Contoh: Pempek Kapal Selam..."
                className="w-full rounded-xl border border-orange-200 bg-white py-3 pl-12 pr-12 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              {/* TOMBOL HAPUS PENCARIAN */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Hapus pencarian"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition hover:text-orange-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* JUMLAH HASIL */}
            {!isLoading && !errorMessage && (
              <p className="mt-3 text-sm text-gray-500">
                Menampilkan {filteredProducts.length} dari {products.length} produk
              </p>
            )}
          </div>

          {/* LOADING */}
          {isLoading && (
            <div className="py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
              <p className="mt-4 text-gray-600">
                Sedang mengambil data produk...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!isLoading && errorMessage && (
            <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">⚠️</div>

              <h2 className="text-xl font-bold text-gray-800">
                Gagal Memuat Produk
              </h2>

              <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>

              <button
                type="button"
                onClick={fetchProducts}
                className="mt-5 rounded-full bg-[#8B4A2F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-800"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* PRODUK BERHASIL DIMUAT */}
          {!isLoading && !errorMessage && (
            <>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const availableStock = Math.max(
                      0,
                      Math.floor(Number(product.stock) || 0)
                    );
                    const isOutOfStock = availableStock <= 0;

                    return (
                      <div
                        key={product.id}
                        className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        {/* GAMBAR PRODUK */}
                        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#F3E6D6]">
                          {product.image ? (
                            <img
                              src={getImageUrl(product.image)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-7xl">🍽️</span>
                          )}

                          {isOutOfStock && (
                            <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow">
                              Stok Habis
                            </span>
                          )}
                        </div>

                        {/* INFORMASI PRODUK */}
                        <div className="p-5">
                          <h2 className="text-lg font-bold">{product.name}</h2>

                          <p className="mt-2 text-sm text-gray-500">
                            {product.description}
                          </p>

                          <p
                            className={`mt-3 text-sm font-semibold ${
                              isOutOfStock ? "text-red-600" : "text-green-700"
                            }`}
                          >
                            {isOutOfStock
                              ? "Stok: 0 (Habis)"
                              : `Stok tersedia: ${availableStock}`}
                          </p>

                          <div className="mt-5 flex items-center justify-between gap-2">
                            <span className="font-bold text-[#8B4A2F]">
                              {formatRupiah(product.price)}
                            </span>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() =>
                                addToCart({
                                  ...product,
                                  price: Number(product.price),
                                  stock: availableStock,
                                })
                              }
                              className={`rounded-full px-4 py-2 text-sm text-white transition ${
                                isOutOfStock
                                  ? "cursor-not-allowed bg-gray-400"
                                  : "bg-[#8B4A2F] hover:bg-orange-800"
                              }`}
                            >
                              {isOutOfStock ? "Stok Habis" : "+ Keranjang"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* PRODUK TIDAK DITEMUKAN */
                <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">
                  <div className="mb-4 text-5xl">🔍</div>

                  <h2 className="text-xl font-bold text-gray-800">
                    Produk tidak ditemukan
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Kami tidak menemukan produk dengan kata "{searchTerm}".
                  </p>

                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="mt-5 rounded-full bg-[#8B4A2F] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-800"
                  >
                    Tampilkan Semua Produk
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
