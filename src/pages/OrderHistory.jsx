import { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost/dapure-jadule-api";
const API_URL = `${API_BASE}/api/order-detail.php`;
const UPLOAD_URL = `${API_BASE}/api/upload-payment-proof.php`;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB (sama dengan batas di PHP)
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(number) || 0);
}

function formatTanggal(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function getStatusInfo(status) {
  const statuses = {
    pending: {
      label: "Menunggu Pembayaran",
      color: "bg-yellow-100 text-yellow-800",
      description:
        "Pesanan berhasil dibuat dan sedang menunggu pembayaran.",
    },
    paid: {
      label: "Sudah Dibayar",
      color: "bg-blue-100 text-blue-800",
      description:
        "Pembayaran telah diterima. Pesanan menunggu proses persiapan.",
    },
    processing: {
      label: "Sedang Diproses",
      color: "bg-purple-100 text-purple-800",
      description: "Pesanan sedang disiapkan oleh tim Dapure Jadule.",
    },
    shipped: {
      label: "Sedang Dikirim",
      color: "bg-indigo-100 text-indigo-800",
      description: "Pesanan sedang dalam perjalanan menuju alamat Anda.",
    },
    completed: {
      label: "Selesai",
      color: "bg-green-100 text-green-800",
      description: "Pesanan telah selesai. Terima kasih telah berbelanja!",
    },
    cancelled: {
      label: "Dibatalkan",
      color: "bg-red-100 text-red-800",
      description: "Pesanan ini telah dibatalkan.",
    },
  };

  return (
    statuses[status] || {
      label: status || "Tidak diketahui",
      color: "bg-gray-100 text-gray-700",
      description: "Status pesanan belum tersedia.",
    }
  );
}

const timelineSteps = [
  {
    title: "Pesanan Dibuat",
    description: "Pesanan berhasil tercatat di sistem.",
  },
  {
    title: "Pembayaran",
    description: "Pembayaran pesanan dikonfirmasi.",
  },
  {
    title: "Pesanan Diproses",
    description: "Produk sedang disiapkan.",
  },
  {
    title: "Pesanan Dikirim",
    description: "Pesanan sedang dalam perjalanan.",
  },
  {
    title: "Pesanan Selesai",
    description: "Pesanan telah diterima dan selesai.",
  },
];

function getCurrentTimelineStep(status) {
  const steps = {
    pending: 1,
    paid: 2,
    processing: 2,
    shipped: 3,
    completed: 4,
  };

  return steps[status] ?? -1;
}

function getTimelineDescription(status, index) {
  if (status === "pending" && index === 1) {
    return "Menunggu pembayaran.";
  }

  if (status === "paid" && index === 2) {
    return "Pembayaran diterima, menunggu proses persiapan.";
  }

  if (status === "processing" && index === 2) {
    return "Pesanan sedang disiapkan.";
  }

  if (status === "shipped" && index === 3) {
    return "Pesanan sedang dalam perjalanan.";
  }

  if (status === "completed" && index === 4) {
    return "Pesanan telah selesai.";
  }

  return timelineSteps[index].description;
}

export default function OrderHistory() {
  const [form, setForm] = useState({
    order_code: "",
    customer_phone: "",
  });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [accountCopyMessage, setAccountCopyMessage] = useState("");

  // STATE UPLOAD BUKTI PEMBAYARAN
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Bersihkan URL preview agar tidak memenuhi memori browser
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetUploadForm() {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    setUploadError("");
    setUploadSuccess("");

    if (!file) {
      resetUploadForm();
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      resetUploadForm();
      setUploadError("Format file harus JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      resetUploadForm();
      setUploadError("Ukuran file maksimal 2 MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUploadProof(e) {
    e.preventDefault();

    if (!order) return;

    if (!selectedFile) {
      setUploadError("Silakan pilih foto bukti transfer terlebih dahulu.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("order_code", order.order_code);
      formData.append("customer_phone", order.customer_phone);
      formData.append("payment_proof", selectedFile);

      // Jangan set Content-Type manual, browser mengaturnya otomatis
      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Bukti pembayaran gagal diunggah."
        );
      }

      setOrder((prev) => ({
        ...prev,
        payment_proof: result.data.payment_proof,
        payment_proof_uploaded_at: result.data.payment_proof_uploaded_at,
      }));

      setUploadSuccess(
        "Bukti pembayaran berhasil dikirim! Admin akan segera memeriksanya."
      );
      resetUploadForm();
    } catch (err) {
      setUploadError(
        err.message || "Terjadi kesalahan saat mengunggah bukti pembayaran."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSearch(e) {
    e.preventDefault();

    setError("");
    setOrder(null);
    setCopyMessage("");
    setAccountCopyMessage("");
    setUploadSuccess("");
    resetUploadForm();

    if (!form.order_code.trim() || !form.customer_phone.trim()) {
      setError("Kode pesanan dan nomor HP wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_code: form.order_code.trim().toUpperCase(),
          customer_phone: form.customer_phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Pesanan tidak berhasil ditemukan."
        );
      }

      setOrder(result.data);
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat menghubungi server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyOrderCode() {
    if (!order?.order_code) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Fitur salin tidak tersedia di browser ini.");
      }

      await navigator.clipboard.writeText(order.order_code);
      setCopyMessage("Kode pesanan berhasil disalin!");
    } catch {
      setCopyMessage(
        "Kode belum dapat disalin. Silakan salin kode secara manual."
      );
    }
  }

  async function handleCopyAccountNumber() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Fitur salin tidak tersedia di browser ini.");
      }

      await navigator.clipboard.writeText("0212366721");
      setAccountCopyMessage("Nomor rekening berhasil disalin!");
    } catch {
      setAccountCopyMessage(
        "Nomor rekening belum dapat disalin. Silakan salin secara manual."
      );
    }
  }

  function handleSearchAnother() {
    setOrder(null);
    setError("");
    setCopyMessage("");
    setAccountCopyMessage("");
    setUploadSuccess("");
    resetUploadForm();

    setForm({
      order_code: "",
      customer_phone: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const statusInfo = order ? getStatusInfo(order.status) : null;
  const currentStep = order
    ? getCurrentTimelineStep(order.status)
    : -1;

  return (
    <div className="min-h-screen bg-[#FFFDF8] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#A66A45]">
            Dapure Jadule
          </p>

          <h1 className="text-3xl font-bold text-[#4A2C20] md:text-4xl">
            Riwayat & Pelacakan Pesanan
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
            Masukkan kode pesanan dan nomor HP yang digunakan
            saat melakukan pemesanan untuk melihat detail
            dan status pesanan Anda.
          </p>
        </div>

        {/* FORM PENCARIAN */}
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-[#F0E5D8] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#4A2C20]">
              Cari Pesanan Anda
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gunakan informasi yang diperoleh setelah checkout.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label
                htmlFor="order_code"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Kode Pesanan
              </label>

              <input
                id="order_code"
                name="order_code"
                type="text"
                value={form.order_code}
                onChange={handleChange}
                placeholder="Contoh: DJ-20261122-ABC123"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#A66A45] focus:ring-2 focus:ring-[#A66A45]/20"
                required
              />
            </div>

            <div>
              <label
                htmlFor="customer_phone"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Nomor HP
              </label>

              <input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                value={form.customer_phone}
                onChange={handleChange}
                placeholder="Masukkan nomor HP saat checkout"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#A66A45] focus:ring-2 focus:ring-[#A66A45]/20"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#8B4A2F] px-5 py-3.5 font-semibold text-white transition hover:bg-[#713A25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sedang Mencari..." : "Cari Pesanan"}
            </button>
          </form>
        </div>

        {/* HASIL PENCARIAN */}
        {order && (
          <div className="space-y-6">

            {/* STATUS DAN KODE PESANAN */}
            <div className="rounded-2xl border border-[#F0E5D8] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Kode Pesanan
                  </p>

                  <h2 className="mt-1 break-all text-xl font-bold text-[#4A2C20]">
                    {order.order_code}
                  </h2>

                  <button
                    type="button"
                    onClick={handleCopyOrderCode}
                    className="mt-3 rounded-lg border border-[#8B4A2F] px-3 py-2 text-sm font-semibold text-[#8B4A2F] transition hover:bg-[#FAF5EE]"
                  >
                    Salin Kode Pesanan
                  </button>

                  {copyMessage && (
                    <p className="mt-2 text-xs text-gray-600" role="status">
                      {copyMessage}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-gray-500">
                    Dibuat pada {formatTanggal(order.created_at)}
                  </p>
                </div>

                <span
                  className={`w-fit shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-[#FAF5EE] p-4">
                <p className="font-semibold text-[#4A2C20]">
                  Status Pesanan
                </p>

                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {statusInfo.description}
                </p>
              </div>
            </div>

            {/* TIMELINE PESANAN */}
            <div className="rounded-2xl border border-[#F0E5D8] bg-white p-6 shadow-sm md:p-8">
              <h3 className="mb-2 text-lg font-bold text-[#4A2C20]">
                Perjalanan Pesanan
              </h3>

              <p className="mb-7 text-sm text-gray-500">
                Berikut tahapan perjalanan pesanan Anda.
              </p>

              {order.status === "cancelled" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <span className="text-xl font-bold">!</span>
                    </div>

                    <div>
                      <p className="font-bold text-red-800">
                        Pesanan Dibatalkan
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-red-700">
                        Pesanan ini tidak melanjutkan tahapan pembayaran,
                        persiapan, dan pengiriman.
                      </p>
                    </div>
                  </div>
                </div>
              ) : currentStep >= 0 ? (
                <div className="space-y-0">
                  {timelineSteps.map((step, index) => {
                    // Jika status sudah completed, tahap terakhir juga dianggap selesai.
                    const isCompleted =
                      index < currentStep ||
                      (order.status === "completed" && index === currentStep);
                    const isCurrent =
                      index === currentStep && order.status !== "completed";

                    return (
                      <div key={step.title} className="flex gap-4">
                        {/* GARIS DAN LINGKARAN */}
                        <div className="flex w-7 shrink-0 flex-col items-center">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              isCompleted
                                ? "border-green-600 bg-green-600 text-white"
                                : isCurrent
                                  ? "border-[#A66A45] bg-[#A66A45] text-white"
                                  : "border-gray-300 bg-white text-gray-400"
                            }`}
                          >
                            {isCompleted ? "✓" : index + 1}
                          </div>

                          {index !== timelineSteps.length - 1 && (
                            <div
                              className={`my-1 min-h-12 w-0.5 ${
                                isCompleted
                                  ? "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>

                        {/* KETERANGAN TAHAP */}
                        <div className="pb-7">
                          <p
                            className={`font-semibold ${
                              isCompleted || isCurrent
                                ? "text-[#4A2C20]"
                                : "text-gray-400"
                            }`}
                          >
                            {step.title}
                          </p>

                          <p
                            className={`mt-1 text-sm leading-relaxed ${
                              isCurrent
                                ? "font-medium text-[#8B4A2F]"
                                : "text-gray-500"
                            }`}
                          >
                            {isCompleted
                              ? step.description
                              : isCurrent
                                ? getTimelineDescription(
                                    order.status,
                                    index
                                  )
                                : "Menunggu tahapan sebelumnya selesai."}
                          </p>

                          {isCurrent && (
                            <span className="mt-2 inline-block rounded-full bg-[#FAF0E8] px-3 py-1 text-xs font-semibold text-[#8B4A2F]">
                              Tahap saat ini
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Timeline belum tersedia untuk status pesanan ini.
                </div>
              )}

              <p className="mt-2 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500">
                Informasi tahapan mengikuti status pesanan yang tersimpan
                di sistem. Perubahan status akan terlihat setelah data
                pesanan diperbarui.
              </p>
            </div>

            {/* INFORMASI PELANGGAN */}
            <div className="rounded-2xl border border-[#F0E5D8] bg-white p-6 shadow-sm md:p-8">
              <h3 className="mb-5 text-lg font-bold text-[#4A2C20]">
                Informasi Pelanggan
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">
                    Nama Pelanggan
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {order.customer_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Nomor HP
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {order.customer_phone}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">
                    Alamat Pengiriman
                  </p>
                  <p className="mt-1 leading-relaxed text-gray-800">
                    {order.customer_address}
                  </p>
                </div>

                {order.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">
                      Catatan Pesanan
                    </p>
                    <p className="mt-1 text-gray-800">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DETAIL PRODUK */}
            <div className="rounded-2xl border border-[#F0E5D8] bg-white p-6 shadow-sm md:p-8">
              <h3 className="mb-5 text-lg font-bold text-[#4A2C20]">
                Detail Produk
              </h3>

              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={`${item.product_id}-${index}`}
                    className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.product_name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatRupiah(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold text-[#8B4A2F]">
                      {formatRupiah(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span>{formatRupiah(order.shipping_cost)}</span>
                </div>

                <div className="flex justify-between border-t border-dashed border-gray-300 pt-4">
                  <span className="font-bold text-gray-800">
                    Total Pembayaran
                  </span>

                  <span className="text-xl font-bold text-[#8B4A2F]">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* INFORMASI PEMBAYARAN */}
            <div className="rounded-2xl border border-[#F0E5D8] bg-white p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-lg font-bold text-[#4A2C20]">
                Informasi Pembayaran
              </h3>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Metode Pembayaran
                </span>

                <span className="text-sm font-semibold capitalize text-gray-800">
                  {order.payment_method === "transfer"
                    ? "Transfer Bank Manual"
                    : order.payment_method}
                </span>
              </div>

              {order.payment_method === "transfer" &&
                order.status === "pending" && (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏦</span>
                      <div>
                        <h4 className="font-bold text-blue-900">
                          Silakan Lakukan Pembayaran
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-blue-800">
                          Pesanan kamu masih menunggu pembayaran. Transfer
                          sesuai nominal berikut ke rekening Dapure Jadule.
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
                        className="mt-4 w-full rounded-xl bg-[#8B4A2F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#713A25]"
                      >
                        📋 Salin Nomor Rekening
                      </button>

                      {accountCopyMessage && (
                        <p
                          role="status"
                          className="mt-2 text-center text-xs text-gray-600"
                        >
                          {accountCopyMessage}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-200 bg-white/70 p-4">
                      <p className="text-xs font-semibold text-blue-800">
                        TOTAL YANG HARUS DITRANSFER
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#8B4A2F]">
                        {formatRupiah(order.total_amount)}
                      </p>
                    </div>

                    <div className="mt-4 space-y-2 text-sm leading-relaxed text-blue-900">
                      <p>
                        Setelah transfer, unggah foto bukti pembayaran pada
                        formulir di bawah ini.
                      </p>
                      <p className="text-xs text-blue-700">
                        Status pesanan akan berubah setelah pembayaran
                        diperiksa dan dikonfirmasi oleh admin.
                      </p>
                    </div>
                  </div>
                )}

              {/* UPLOAD BUKTI PEMBAYARAN */}
              {order.payment_method === "transfer" &&
                order.status === "pending" && (
                  <div className="mt-5 rounded-2xl border border-[#F0E5D8] bg-[#FFFDF8] p-5">
                    <h4 className="font-bold text-[#4A2C20]">
                      Unggah Bukti Pembayaran
                    </h4>

                    {order.payment_proof ? (
                      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="font-semibold text-green-800">
                          ✅ Bukti pembayaran sudah dikirim
                        </p>
                        <p className="mt-1 text-sm text-green-700">
                          Dikirim pada{" "}
                          {formatTanggal(order.payment_proof_uploaded_at)}.
                          Admin sedang memeriksa pembayaranmu.
                        </p>

                        <a
                          href={`${API_BASE}/${order.payment_proof}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block"
                        >
                          <img
                            src={`${API_BASE}/${order.payment_proof}`}
                            alt="Bukti pembayaran yang sudah diunggah"
                            className="max-h-64 w-full rounded-lg border border-green-200 bg-white object-contain"
                          />
                        </a>

                        <p className="mt-3 text-xs text-green-700">
                          Salah kirim foto? Kamu bisa mengunggah ulang selama
                          pesanan masih menunggu pembayaran.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        Pilih foto bukti transfer (JPG, PNG, atau WEBP,
                        maksimal 2 MB).
                      </p>
                    )}

                    <form onSubmit={handleUploadProof} className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="payment_proof"
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          {order.payment_proof
                            ? "Ganti Bukti Pembayaran"
                            : "Foto Bukti Transfer"}
                        </label>

                        <input
                          ref={fileInputRef}
                          id="payment_proof"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          disabled={uploading}
                          className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-[#8B4A2F] file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white hover:file:bg-[#713A25] disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>

                      {selectedFile && (
                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                          <p className="break-all text-sm font-semibold text-gray-800">
                            {selectedFile.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>

                          {previewUrl && (
                            <img
                              src={previewUrl}
                              alt="Pratinjau bukti pembayaran"
                              className="mt-3 max-h-64 w-full rounded-lg border border-gray-100 object-contain"
                            />
                          )}
                        </div>
                      )}

                      {uploadError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                          {uploadError}
                        </div>
                      )}

                      {uploadSuccess && (
                        <div
                          role="status"
                          className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                        >
                          {uploadSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={uploading || !selectedFile}
                        className="w-full rounded-xl bg-[#8B4A2F] px-5 py-3.5 font-semibold text-white transition hover:bg-[#713A25] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploading
                          ? "Sedang Mengunggah..."
                          : order.payment_proof
                          ? "Kirim Ulang Bukti Pembayaran"
                          : "Kirim Bukti Pembayaran"}
                      </button>
                    </form>
                  </div>
                )}

              {/* BUKTI SUDAH TERSIMPAN (STATUS SELAIN PENDING) */}
              {order.payment_method === "transfer" &&
                order.status !== "pending" &&
                order.status !== "cancelled" &&
                order.payment_proof && (
                  <div className="mt-5 rounded-xl border border-[#F0E5D8] bg-[#FFFDF8] p-4">
                    <p className="text-sm font-semibold text-[#4A2C20]">
                      Bukti pembayaran yang kamu kirim
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Dikirim pada{" "}
                      {formatTanggal(order.payment_proof_uploaded_at)}
                    </p>
                    <a
                      href={`${API_BASE}/${order.payment_proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block"
                    >
                      <img
                        src={`${API_BASE}/${order.payment_proof}`}
                        alt="Bukti pembayaran"
                        className="max-h-64 w-full rounded-lg border border-gray-100 bg-white object-contain"
                      />
                    </a>
                  </div>
                )}

              {order.status === "paid" && (
                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-900">
                    Pembayaran telah dikonfirmasi.
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    Pesanan kamu selanjutnya akan diproses oleh Dapure Jadule.
                  </p>
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-800">
                    Pesanan ini telah dibatalkan.
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    Silakan hubungi admin jika kamu membutuhkan informasi
                    lebih lanjut mengenai pesanan ini.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSearchAnother}
              className="w-full rounded-xl border border-[#8B4A2F] bg-white px-5 py-3 font-semibold text-[#8B4A2F] transition hover:bg-[#FAF5EE]"
            >
              Cari Pesanan Lain
            </button>
          </div>
        )}

        {/* FOOTER KECIL */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            Pastikan kode pesanan dan nomor HP yang dimasukkan benar.
          </p>
        </div>

      </div>
    </div>
  );
}