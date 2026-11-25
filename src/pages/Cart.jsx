import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_URL = "http://localhost/dapure-jadule-api/api/products.php";

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(number) || 0);
}

export default function Cart() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    updateCartStock,
    totalItems,
    totalPrice,
  } = useCart();

  const [animatedId, setAnimatedId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [stockCheckStatus, setStockCheckStatus] = useState("checking");
  const [stockCheckMessage, setStockCheckMessage] = useState("");

  // MENGAMBIL STOK TERBARU DARI DATABASE
  async function checkLatestStock() {
    setStockCheckStatus("checking");
    setStockCheckMessage("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Server gagal merespons permintaan stok.");
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Data stok produk tidak sesuai.");
      }

      updateCartStock(result.data);
      setStockCheckStatus("ready");
    } catch (error) {
      console.error("Gagal memeriksa stok terbaru:", error);
      setStockCheckStatus("error");
      setStockCheckMessage(
        "Stok terbaru belum dapat diperiksa. Pastikan Apache dan MySQL XAMPP aktif, lalu coba periksa kembali."
      );
    }
  }

  // PERIKSA STOK SETIAP KALI HALAMAN KERANJANG DIBUKA
  useEffect(() => {
    checkLatestStock();
  }, []);

  // MEMERIKSA APAKAH ADA JUMLAH PESANAN YANG TIDAK VALID
  const hasInvalidStock = cart.some((item) => {
    const availableStock = Number(item.stock) || 0;
    return availableStock <= 0 || item.quantity > availableStock;
  });

  const canCheckout =
    stockCheckStatus === "ready" && cart.length > 0 && !hasInvalidStock;

  function handleQuantityChange(id, action) {
    setAnimatedId(id);

    if (action === "increase") {
      increaseQuantity(id);
    } else {
      decreaseQuantity(id);
    }

    setTimeout(() => {
      setAnimatedId((current) => (current === id ? null : current));
    }, 200);
  }

  function handleDelete() {
    if (!productToDelete) return;

    removeFromCart(productToDelete.id);
    setProductToDelete(null);
  }

  // KERANJANG KOSONG
  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#FFFDF8] px-4 py-20 text-center">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 shadow-sm">
          <div className="mb-5 text-6xl">🛒</div>

          <h1 className="text-2xl font-bold text-[#35251D]">
            Keranjang Masih Kosong
          </h1>

          <p className="mt-3 text-gray-500">
            Yuk, pilih pempek favoritmu dan tambahkan ke keranjang terlebih dahulu.
          </p>

          <Link
            to="/pemesanan"
            className="mt-7 inline-block rounded-full bg-[#8B4A2F] px-8 py-3 font-semibold text-white transition hover:bg-orange-800"
          >
            Lihat Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF8] px-4 py-10 pb-28 sm:px-8 lg:pb-10">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8">
          <p className="font-semibold text-orange-700">Dapure Jadule</p>

          <h1 className="mt-2 text-3xl font-bold text-[#35251D] sm:text-4xl">
            Keranjang Belanja
          </h1>

          <p className="mt-2 text-gray-500">
            Periksa kembali produk pilihanmu sebelum checkout.
          </p>
        </div>

        {/* PROGRESS PEMESANAN */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B4A2F] text-sm font-bold text-white">
              1
            </span>
            <span className="text-sm font-bold text-[#8B4A2F]">Keranjang</span>
          </div>

          <div className="h-0.5 flex-1 bg-orange-200" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400">
              2
            </span>
            <span className="text-sm text-gray-400">Checkout</span>
          </div>

          <div className="h-0.5 flex-1 bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400">
              3
            </span>
            <span className="text-sm text-gray-400">Selesai</span>
          </div>
        </div>

        {/* STATUS PEMERIKSAAN STOK */}
        {stockCheckStatus === "checking" && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Sedang memeriksa ketersediaan stok terbaru...
          </div>
        )}

        {stockCheckStatus === "error" && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{stockCheckMessage}</p>
            <button
              type="button"
              onClick={checkLatestStock}
              className="mt-3 rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
            >
              Periksa Stok Kembali
            </button>
          </div>
        )}

        {stockCheckStatus === "ready" && hasInvalidStock && (
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
            <p className="font-semibold">Ada produk yang stoknya tidak mencukupi.</p>
            <p className="mt-1">
              Silakan sesuaikan jumlah pesanan atau hapus produk yang sudah habis sebelum checkout.
            </p>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-3">
          {/* DAFTAR PRODUK */}
          <section className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#35251D]">
                Produk Pilihanmu
              </h2>

              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[#8B4A2F]">
                {totalItems} Produk
              </span>
            </div>

            {cart.map((item) => {
              const availableStock = Math.max(0, Number(item.stock) || 0);
              const isOutOfStock = availableStock <= 0;
              const exceedsStock = item.quantity > availableStock;
              const cannotIncrease =
                stockCheckStatus !== "ready" ||
                isOutOfStock ||
                item.quantity >= availableStock;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* GAMBAR PRODUK */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#FAF5EE] text-4xl">
                      {item.emoji || "🍢"}
                    </div>

                    {/* INFORMASI PRODUK */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#35251D]">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatRupiah(item.price)} / produk
                      </p>

                      {stockCheckStatus === "ready" && (
                        <p
                          className={`mt-2 text-sm font-semibold ${
                            isOutOfStock || exceedsStock
                              ? "text-red-600"
                              : "text-green-700"
                          }`}
                        >
                          {isOutOfStock
                            ? "Stok Habis"
                            : `Stok tersedia: ${availableStock}`}
                        </p>
                      )}

                      {exceedsStock && !isOutOfStock && (
                        <p className="mt-1 text-xs text-red-600">
                          Jumlah pesanan melebihi stok. Kurangi menjadi maksimal {availableStock}.
                        </p>
                      )}

                      <p className="mt-2 font-bold text-[#8B4A2F]">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* KONTROL PRODUK */}
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-3 rounded-full border border-orange-200 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, "decrease")}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF5EE] text-lg font-bold text-[#8B4A2F] transition hover:bg-orange-100 active:scale-90"
                          aria-label={`Kurangi ${item.name}`}
                        >
                          −
                        </button>

                        <span
                          key={item.quantity}
                          className={`min-w-5 text-center font-bold text-[#35251D] ${
                            animatedId === item.id ? "quantity-animation" : ""
                          }`}
                        >
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, "increase")}
                          disabled={cannotIncrease}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B4A2F] text-lg font-bold text-white transition hover:bg-orange-800 active:scale-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                          aria-label={`Tambah ${item.name}`}
                          title={cannotIncrease ? "Jumlah sudah mencapai batas stok" : "Tambah jumlah"}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setProductToDelete(item)}
                        className="text-sm font-semibold text-red-500 transition hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              to="/pemesanan"
              className="inline-block pt-2 font-semibold text-[#8B4A2F] hover:underline"
            >
              ← Lanjut Belanja
            </Link>
          </section>

          {/* RINGKASAN BELANJA */}
          <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-[#35251D]">
              Ringkasan Belanja
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total Produk</span>
                <span className="font-semibold">{totalItems} item</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatRupiah(totalPrice)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Pengiriman</span>
                <span className="text-xs text-gray-400">Dihitung kemudian</span>
              </div>

              <div className="border-t border-dashed border-orange-200 pt-4">
                <div className="flex justify-between gap-3 font-bold text-[#35251D]">
                  <span>Total Harga</span>
                  <span className="text-lg text-[#8B4A2F]">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {canCheckout ? (
              <Link
                to="/checkout"
                className="mt-7 hidden rounded-full bg-[#8B4A2F] px-6 py-3 text-center font-semibold text-white transition hover:bg-orange-800 active:scale-95 lg:block"
              >
                Lanjut ke Checkout →
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-7 hidden w-full cursor-not-allowed rounded-full bg-gray-300 px-6 py-3 text-center font-semibold text-gray-500 lg:block"
              >
                {stockCheckStatus === "checking" ? "Memeriksa Stok..." : "Checkout Belum Tersedia"}
              </button>
            )}

            <p className="mt-4 text-center text-xs text-gray-400">
              Pastikan pesananmu sudah sesuai sebelum melanjutkan.
            </p>
          </aside>
        </div>
      </div>

      {/* TOMBOL CHECKOUT MOBILE */}
      <div className="fixed bottom-0 left-0 z-40 w-full border-t border-orange-100 bg-white p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Belanja</p>
            <p className="text-lg font-bold text-[#8B4A2F]">
              {formatRupiah(totalPrice)}
            </p>
          </div>

          {canCheckout ? (
            <Link
              to="/checkout"
              className="rounded-full bg-[#8B4A2F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-800 active:scale-95"
            >
              Checkout →
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full bg-gray-300 px-6 py-3 text-sm font-semibold text-gray-500"
            >
              {stockCheckStatus === "checking" ? "Memeriksa..." : "Stok Tidak Valid"}
            </button>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setProductToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="delete-title" className="text-xl font-bold text-[#35251D]">
                Hapus Produk?
              </h2>

              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="text-2xl text-gray-400 hover:text-gray-700"
                aria-label="Tutup konfirmasi"
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-[#FAF5EE] p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-3xl">
                {productToDelete.emoji || "🍢"}
              </div>

              <div>
                <h3 className="font-bold text-[#35251D]">{productToDelete.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {formatRupiah(productToDelete.price)}
                </p>
              </div>
            </div>

            <p className="my-5 text-sm leading-relaxed text-gray-500">
              Apakah kamu yakin ingin menghapus produk ini dari keranjang belanja?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 rounded-full border border-gray-200 px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-full bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
