
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(number) || 0);
}

export default function Checkout() {
  const {
    cart,
    totalItems,
    totalPrice,
    removeFromCart,
    updateCartStock,
  } = useCart();

  // DATA PELANGGAN
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  // STATE FORM DAN PEMBAYARAN
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // STATE API
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [orderResult, setOrderResult] = useState(null);

  // STATE PENGECEKAN STOK TERBARU
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockCheckError, setStockCheckError] = useState("");
  const [stockIssues, setStockIssues] = useState([]);

  // STATE COPY KODE PESANAN
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [accountCopied, setAccountCopied] = useState(false);

  // MENGUBAH DATA PELANGGAN
  function handleCustomerChange(e) {
    const { name, value } = e.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  // VALIDASI FORM
  function validateForm() {
    const newErrors = {};

    if (!customer.name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi.";
    }

    if (!customer.phone.trim()) {
      newErrors.phone = "Nomor HP wajib diisi.";
    } else if (!/^[0-9+\-\s]{9,16}$/.test(customer.phone.trim())) {
      newErrors.phone = "Periksa kembali nomor HP kamu.";
    }

    if (!customer.address.trim()) {
      newErrors.address = "Alamat pengiriman wajib diisi.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // MEMERIKSA STOK TERBARU SEBELUM MEMBUKA MODAL KONFIRMASI
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cart.length === 0 || isCheckingStock || orderResult) {
      return;
    }

    setIsCheckingStock(true);
    setStockCheckError("");
    setStockIssues([]);
    setApiError("");

    try {
      const response = await fetch(
        "http://localhost/dapure-jadule-api/api/products.php",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.message || "Gagal mengambil data stok terbaru."
        );
      }

      // Sinkronkan stok terbaru ke CartContext.
      updateCartStock(result.data);

      // Bandingkan jumlah di keranjang dengan stok database.
      const latestProducts = result.data;
      const problems = [];

      cart.forEach((item) => {
        const latestProduct = latestProducts.find(
          (product) => Number(product.id) === Number(item.id)
        );

        const availableStock = latestProduct
          ? Math.max(0, Number(latestProduct.stock) || 0)
          : 0;

        if (!latestProduct || availableStock < Number(item.quantity)) {
          problems.push({
            id: item.id,
            name: latestProduct?.name || item.name,
            requested: Number(item.quantity),
            available: availableStock,
          });
        }
      });

      if (problems.length > 0) {
        setStockIssues(problems);
        return;
      }

      // Modal hanya dibuka jika semua stok masih mencukupi.
      setShowConfirmation(true);
    } catch (error) {
      console.error("Gagal memeriksa stok:", error);

      setStockCheckError(
        error.message ||
        "Tidak dapat memeriksa stok. Periksa koneksi server lalu coba lagi."
      );
    } finally {
      setIsCheckingStock(false);
    }
  }

  // MENGIRIM PESANAN KE PHP API
  async function handleConfirmOrder() {
    if (isSubmitting || orderResult) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const response = await fetch(
        "http://localhost/dapure-jadule-api/api/orders.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: customer.name.trim(),
            customer_phone: customer.phone.trim(),
            customer_address: customer.address.trim(),
            notes: customer.notes.trim(),
            payment_method: paymentMethod,

            // PHP akan mengambil harga langsung dari database.
            items: cart.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Pesanan gagal disimpan."
        );
      }

      // SIMPAN HASIL TRANSAKSI
      setOrderResult(result.data);

      // RESET STATUS COPY
      setCopied(false);
      setCopyError("");

      // KOSONGKAN KERANJANG SETELAH TRANSAKSI BERHASIL
      cart.forEach((item) => {
        removeFromCart(item.id);
      });

    } catch (error) {
      console.error("Gagal membuat pesanan:", error);

      setApiError(
        error.message ||
        "Terjadi kesalahan saat menghubungi server."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // MENYALIN KODE PESANAN
  async function handleCopyOrderCode() {
    if (!orderResult?.order_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(orderResult.order_code);

      setCopied(true);
      setCopyError("");
    } catch (error) {
      console.error("Gagal menyalin kode:", error);

      setCopied(false);
      setCopyError(
        "Kode belum berhasil disalin. Silakan salin kode secara manual."
      );
    }
  }

  // MENYALIN NOMOR REKENING BCA
  async function handleCopyAccountNumber() {
    try {
      await navigator.clipboard.writeText("0212366721");
      setAccountCopied(true);
    } catch (error) {
      console.error("Gagal menyalin nomor rekening:", error);
      setAccountCopied(false);
    }
  }

  // TAMPILAN JIKA KERANJANG KOSONG
  if (cart.length === 0 && !orderResult) {
    return (
      <main className="min-h-screen bg-[#FFFDF8] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mb-5 text-6xl">🛒</div>

          <h1 className="text-2xl font-bold text-[#35251D]">
            Keranjang Masih Kosong
          </h1>

          <p className="mt-3 text-gray-500">
            Tambahkan produk terlebih dahulu sebelum melakukan checkout.
          </p>

          <Link
            to="/pemesanan"
            className="mt-7 inline-block rounded-full bg-[#8B4A2F] px-8 py-3 font-semibold text-white hover:bg-orange-800"
          >
            Lihat Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF8] px-4 py-10 pb-12 sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="font-semibold text-orange-700">
            Dapure Jadule
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#35251D] sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Lengkapi informasi berikut untuk melanjutkan pemesanan.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="mb-8 flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              ✓
            </span>

            <span className="hidden text-sm font-semibold text-green-700 sm:block">
              Keranjang
            </span>
          </div>

          <div className="h-0.5 flex-1 bg-[#8B4A2F]" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B4A2F] text-sm font-bold text-white">
              2
            </span>

            <span className="text-sm font-semibold text-[#8B4A2F]">
              Checkout
            </span>
          </div>

          <div className="h-0.5 flex-1 bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              orderResult
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}>
              {orderResult ? "✓" : "3"}
            </span>

            <span className={`hidden text-sm sm:block ${
              orderResult
                ? "font-semibold text-green-700"
                : "text-gray-400"
            }`}>
              Selesai
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid items-start gap-8 lg:grid-cols-3">

            {/* FORM PELANGGAN */}
            <section className="space-y-6 lg:col-span-2">

              {/* INFORMASI PELANGGAN */}
              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#35251D]">
                  Informasi Pelanggan
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Masukkan data penerima pesanan.
                </p>

                <div className="mt-6 space-y-5">

                  {/* NAMA */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Nama Lengkap *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={customer.name}
                      onChange={handleCustomerChange}
                      placeholder="Masukkan nama lengkap"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#8B4A2F] focus:ring-2 focus:ring-orange-100"
                    />

                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* NOMOR HP */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Nomor WhatsApp / HP *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={customer.phone}
                      onChange={handleCustomerChange}
                      placeholder="Contoh: 081234567890"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#8B4A2F] focus:ring-2 focus:ring-orange-100"
                    />

                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* ALAMAT */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Alamat Pengiriman *
                    </label>

                    <textarea
                      name="address"
                      value={customer.address}
                      onChange={handleCustomerChange}
                      rows="4"
                      placeholder="Masukkan alamat lengkap, kecamatan, kota, dan patokan lokasi"
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#8B4A2F] focus:ring-2 focus:ring-orange-100"
                    />

                    {errors.address && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* CATATAN */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Catatan Pesanan
                      <span className="ml-2 font-normal text-gray-400">
                        (Opsional)
                      </span>
                    </label>

                    <textarea
                      name="notes"
                      value={customer.notes}
                      onChange={handleCustomerChange}
                      rows="3"
                      placeholder="Contoh: Jangan terlalu pedas, kirim setelah pukul 15.00"
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#8B4A2F] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </div>

              {/* METODE PEMBAYARAN */}
              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#35251D]">
                  Metode Pembayaran
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Pilih metode pembayaran yang tersedia.
                </p>

                <div className="mt-5 space-y-3">

                  {/* TRANSFER BANK */}
                  <label className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                    paymentMethod === "transfer"
                      ? "border-[#8B4A2F] bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 accent-[#8B4A2F]"
                    />

                    <div className="flex-1">
                      <p className="font-semibold text-[#35251D]">
                        Transfer Bank Manual
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Transfer ke rekening BCA yang akan ditampilkan setelah pesanan berhasil dibuat.
                      </p>
                    </div>

                    <span className="text-2xl">🏦</span>
                  </label>

                  {/* MIDTRANS BELUM AKTIF */}
                  <label className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-gray-200 p-4 opacity-50">
                    <input
                      type="radio"
                      name="payment"
                      value="midtrans"
                      disabled
                      className="h-4 w-4 accent-[#8B4A2F]"
                    />

                    <div className="flex-1">
                      <p className="font-semibold text-[#35251D]">
                        Payment Gateway
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Pembayaran online melalui Midtrans (belum diaktifkan).
                      </p>
                    </div>

                    <span className="text-2xl">💳</span>
                  </label>
                </div>
              </div>
            </section>

            {/* RINGKASAN PESANAN */}
            <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-[#35251D]">
                Ringkasan Pesanan
              </h2>

              <div className="mt-5 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FAF5EE] text-2xl">
                      {item.emoji || "🍢"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#35251D]">
                        {item.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {item.quantity} x {formatRupiah(item.price)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-[#8B4A2F]">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-5 border-t border-dashed border-orange-200" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total Produk</span>
                  <span>{totalItems} item</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(totalPrice)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Pengiriman</span>
                  <span className="text-xs text-gray-400">
                    Dihitung kemudian
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-dashed border-orange-200" />

              <div className="flex justify-between gap-3">
                <span className="font-bold text-[#35251D]">
                  Total Harga
                </span>

                <span className="text-lg font-bold text-[#8B4A2F]">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              {/* PERINGATAN HASIL PENGECEKAN STOK */}
              {stockIssues.length > 0 && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-bold text-red-700">
                    Stok beberapa produk tidak mencukupi
                  </p>

                  <div className="mt-2 space-y-2">
                    {stockIssues.map((issue) => (
                      <p key={issue.id} className="text-sm text-red-600">
                        <strong>{issue.name}</strong>: kamu memesan{" "}
                        {issue.requested}, sedangkan stok tersedia{" "}
                        {issue.available}.
                      </p>
                    ))}
                  </div>

                  <Link
                    to="/keranjang"
                    className="mt-3 inline-block text-sm font-bold text-red-700 underline"
                  >
                    Kembali ke keranjang untuk memperbaiki jumlah
                  </Link>
                </div>
              )}

              {stockCheckError && (
                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold text-yellow-800">
                    Stok belum dapat diperiksa
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    {stockCheckError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isCheckingStock || Boolean(orderResult)}
                className="mt-7 w-full rounded-full bg-[#8B4A2F] px-6 py-3 font-semibold text-white transition hover:bg-orange-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCheckingStock
                  ? "Memeriksa Stok..."
                  : "Periksa Pesanan →"}
              </button>

              <Link
                to="/keranjang"
                className="mt-4 block text-center text-sm font-semibold text-[#8B4A2F] hover:underline"
              >
                ← Kembali ke Keranjang
              </Link>

              <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
                Pastikan informasi penerima dan produk sudah benar.
              </p>
            </aside>
          </div>
        </form>
      </div>

      {/* MODAL KONFIRMASI */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => {
            if (!isSubmitting && !orderResult) {
              setShowConfirmation(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* JUDUL MODAL */}
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                orderResult
                  ? "bg-green-100"
                  : "bg-orange-100"
              }`}>
                {orderResult ? "🎉" : "📋"}
              </div>

              <h2
                id="confirmation-title"
                className="mt-4 text-2xl font-bold text-[#35251D]"
              >
                {orderResult
                  ? "Pesanan Berhasil Dibuat!"
                  : "Periksa Pesananmu"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {orderResult
                  ? "Pesanan kamu sudah berhasil disimpan."
                  : "Pastikan semua informasi berikut sudah benar."}
              </p>
            </div>

            {/* INFORMASI PELANGGAN */}
            <div className="mt-6 space-y-4 rounded-2xl bg-[#FAF5EE] p-4">
              <div>
                <p className="text-xs text-gray-500">
                  Nama Penerima
                </p>

                <p className="mt-1 font-semibold text-[#35251D]">
                  {customer.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Nomor HP
                </p>

                <p className="mt-1 font-semibold text-[#35251D]">
                  {customer.phone}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Alamat Pengiriman
                </p>

                <p className="mt-1 whitespace-pre-line font-semibold text-[#35251D]">
                  {customer.address}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Catatan
                </p>

                <p className="mt-1 text-sm text-[#35251D]">
                  {customer.notes || "Tidak ada catatan"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Metode Pembayaran
                </p>

                <p className="mt-1 font-semibold text-[#35251D]">
                  Transfer Bank Manual
                </p>
              </div>

              <div className="border-t border-orange-200 pt-4">
                <p className="text-xs text-gray-500">
                  Total Pesanan
                </p>

                <p className="mt-1 text-xl font-bold text-[#8B4A2F]">
                  {formatRupiah(
                    orderResult
                      ? orderResult.total_amount
                      : totalPrice
                  )}
                </p>
              </div>
            </div>

            {/* PESAN ERROR */}
            {apiError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  Pesanan belum berhasil disimpan
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {apiError}
                </p>
              </div>
            )}

            {/* HASIL PESANAN BERHASIL */}
            {orderResult && (
              <div className="mt-5 space-y-4">

                {/* KODE PESANAN */}
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
                  <div className="mb-3 text-3xl">
                    🎫
                  </div>

                  <p className="text-sm font-medium text-green-700">
                    Kode Pesanan Kamu
                  </p>

                  <p className="mt-2 break-all text-xl font-bold tracking-wide text-green-900 sm:text-2xl">
                    {orderResult.order_code}
                  </p>

                  {/* TOMBOL COPY */}
                  <button
                    type="button"
                    onClick={handleCopyOrderCode}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
                      copied
                        ? "bg-green-700 text-white"
                        : "bg-[#8B4A2F] text-white hover:bg-[#713A25]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <span>✓</span>
                        Kode Berhasil Disalin!
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        Salin Kode Pesanan
                      </>
                    )}
                  </button>

                  {copyError && (
                    <p className="mt-3 text-xs text-red-700">
                      {copyError}
                    </p>
                  )}
                </div>

                {/* PERINGATAN PENTING */}
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      ⚠️
                    </span>

                    <div>
                      <p className="font-bold text-yellow-900">
                        Jangan Lupakan Kode Pesanan!
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-yellow-800">
                        Simpan kode pesanan ini atau ambil screenshot
                        halaman sebagai bukti pemesanan.
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-yellow-800">
                        Kode pesanan dan nomor HP yang kamu gunakan
                        saat checkout diperlukan untuk mengecek
                        riwayat dan status pesanan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* STATUS PESANAN */}
                <div className="rounded-xl bg-[#FAF5EE] p-4">
                  <p className="text-xs text-gray-500">
                    Status Pesanan
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />

                    <p className="font-bold text-[#8B4A2F]">
                      Menunggu Pembayaran
                    </p>
                  </div>
                </div>

                {/* INFORMASI TRANSFER BANK */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏦</span>
                    <div>
                      <p className="font-bold text-blue-900">
                        Informasi Pembayaran
                      </p>
                      <p className="text-xs text-blue-700">
                        Silakan lakukan transfer secara manual ke rekening berikut.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-white p-4">
                    <p className="text-xs text-gray-500">Bank</p>
                    <p className="mt-1 font-bold text-[#35251D]">BCA</p>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Nomor Rekening</p>
                      <p className="mt-1 text-xl font-bold tracking-wider text-[#35251D]">
                        0212366721
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Atas Nama</p>
                      <p className="mt-1 font-semibold text-[#35251D]">
                        Nyayu Meriyanti
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAccountNumber}
                      className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        accountCopied
                          ? "bg-green-600 text-white"
                          : "bg-[#8B4A2F] text-white hover:bg-[#713A25]"
                      }`}
                    >
                      {accountCopied
                        ? "✓ Nomor Rekening Berhasil Disalin"
                        : "📋 Salin Nomor Rekening"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm leading-relaxed text-blue-900">
                    <p>
                      <strong>Total yang harus ditransfer:</strong>
                    </p>
                    <p className="text-2xl font-bold">
                      {formatRupiah(orderResult.total_amount)}
                    </p>
                    <p>
                      Pastikan jumlah transfer sesuai dengan total pesanan.
                      Simpan bukti transfer dan hubungi admin untuk konfirmasi pembayaran.
                    </p>
                    <p className="text-xs text-blue-700">
                      Status pesanan akan tetap menunggu pembayaran sampai pembayaran
                      dikonfirmasi oleh admin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TOMBOL MODAL */}
            <div className="mt-6 flex flex-col gap-3">
              {!orderResult ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isSubmitting}
                    className="w-full rounded-full border border-gray-200 px-5 py-3 font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    Periksa Kembali
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-[#8B4A2F] px-5 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Menyimpan Pesanan..."
                      : "Konfirmasi Pesanan"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/riwayat-pesanan"
                    className="w-full rounded-full bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
                  >
                    Lihat Riwayat Pesanan →
                  </Link>

                  <Link
                    to="/pemesanan"
                    className="w-full rounded-full border border-[#8B4A2F] px-5 py-3 text-center font-semibold text-[#8B4A2F] transition hover:bg-[#FAF5EE]"
                  >
                    Kembali ke Menu
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
              {orderResult
                ? "Terima kasih telah memesan di Dapure Jadule!"
                : "Pesanan akan dikirim ke server untuk diperiksa dan disimpan."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
