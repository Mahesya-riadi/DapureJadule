
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL =
  "http://localhost/dapure-jadule-api/api";

const PROOF_URL =
  "http://localhost/dapure-jadule-api/uploads/payment-proofs/";

export default function AdminOrderDetail() {
  const navigate = useNavigate();
  const { orderCode } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProof, setShowProof] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [success, setSuccess] = useState("");

  const isProcessing = verifying || cancelling || updatingStatus;

  // Mengambil detail pesanan
  const fetchDetail = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin-order-detail.php?order_code=${encodeURIComponent(orderCode)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil detail pesanan."
        );
      }

      setOrder(result.data.order);
      setItems(result.data.items || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [orderCode]);

  // Format rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(number) || 0);
  };

  // Format tanggal
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date.replace(" ", "T")).toLocaleString(
      "id-ID",
      {
        dateStyle: "long",
        timeStyle: "short",
      }
    );
  };

  // Tampilan status
  const getStatus = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "Menunggu Pembayaran",
      paid: "Sudah Dibayar",
      processing: "Sedang Diproses",
      shipped: "Sedang Dikirim",
      completed: "Pesanan Selesai",
      cancelled: "Dibatalkan",
    };

    return (
      <span
        className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // Verifikasi pembayaran
  const verifyPayment = async () => {
    if (!order || isProcessing) return;

    const confirmation = window.confirm(
      `Apakah kamu yakin ingin memverifikasi pembayaran pesanan ${order.order_code} sebesar ${formatRupiah(order.total_amount)}?\n\nPastikan dana sudah benar-benar diterima dan nominalnya sesuai.`
    );

    if (!confirmation) return;

    setVerifying(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/admin-verify-payment.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_code: order.order_code,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Verifikasi pembayaran gagal."
        );
      }

      setSuccess(
        result.message || "Pembayaran berhasil diverifikasi."
      );

      await fetchDetail();
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat verifikasi."
      );
    } finally {
      setVerifying(false);
    }
  };

  // Memperbarui status pesanan setelah pembayaran diverifikasi
  const advanceOrderStatus = async () => {
    if (!order || isProcessing) return;

    const nextStatus = {
      paid: "processing",
      processing: "shipped",
      shipped: "completed",
    };

    const nextStatusLabel = {
      processing: "Sedang Diproses",
      shipped: "Sedang Dikirim",
      completed: "Pesanan Selesai",
    };

    const newStatus = nextStatus[order.status];

    if (!newStatus) return;

    const confirmation = window.confirm(
      `Ubah status pesanan ${order.order_code} menjadi "${nextStatusLabel[newStatus]}"?`
    );

    if (!confirmation) return;

    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/admin-update-order-status.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_code: order.order_code,
            status: newStatus,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Status pesanan gagal diperbarui."
        );
      }

      setSuccess(
        result.message || "Status pesanan berhasil diperbarui."
      );

      await fetchDetail();
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat memperbarui status pesanan."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Membatalkan pesanan
  const cancelOrder = async () => {
    if (!order || isProcessing) return;

    const proofWarning = order.payment_proof
      ? "\n\nPERHATIAN: Pelanggan sudah mengunggah bukti transfer. Periksa rekening dan pastikan dana belum diterima sebelum membatalkan pesanan."
      : "";

    const confirmation = window.confirm(
      `Apakah kamu yakin ingin membatalkan pesanan ${order.order_code}?\n\nPesanan yang dibatalkan tidak dapat diverifikasi melalui proses normal.${proofWarning}\n\nLanjutkan pembatalan?`
    );

    if (!confirmation) return;

    setCancelling(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/admin-cancel-order.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_code: order.order_code,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Pembatalan pesanan gagal."
        );
      }

      setSuccess(
        result.message || "Pesanan berhasil dibatalkan."
      );

      await fetchDetail();
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat membatalkan pesanan."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Sedang mengambil detail pesanan...
        </p>
      </div>
    );
  }

  // Error
  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-100 p-5 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-semibold">
            {error || "Pesanan tidak ditemukan."}
          </p>

          <button
            onClick={() => navigate("/admin/orders")}
            className="mt-5 bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-lg font-semibold"
          >
            Kembali ke Daftar Pesanan
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const proofImage = order.payment_proof
    ? `${PROOF_URL}${encodeURIComponent(
        order.payment_proof.split("/").pop()
      )}`
    : null;

  const canVerify =
    order.status === "pending" &&
    order.payment_method === "transfer" &&
    Boolean(proofImage);

  const canCancel = order.status === "pending";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-800">
              Dapure Jadule
            </h1>

            <p className="text-xs text-gray-500">
              Administrator Panel
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/orders")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Kembali
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-7">
          <p className="text-sm font-semibold text-green-700">
            DAPURE JADULE ADMIN
          </p>

          <h2 className="text-3xl font-bold text-gray-800 mt-1">
            Detail Pesanan
          </h2>

          <p className="text-gray-500 mt-2">
            Informasi lengkap transaksi pelanggan.
          </p>
        </div>

        {/* Notifikasi berhasil */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-5">
            <p className="font-semibold">
              ✓ {success}
            </p>
          </div>
        )}

        {/* Notifikasi error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5">
            <p className="font-semibold">
              {error}
            </p>
          </div>
        )}

        {/* Informasi utama pesanan */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Kode Pesanan
              </p>

              <h3 className="text-xl font-bold text-green-800 mt-1 break-all">
                {order.order_code}
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {formatDate(order.created_at)}
              </p>
            </div>

            <div>{getStatus(order.status)}</div>
          </div>
        </div>

        {/* Informasi pelanggan */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Informasi Pelanggan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Nama Pelanggan
              </p>

              <p className="font-semibold text-gray-800">
                {order.customer_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">
                Nomor Telepon
              </p>

              <p className="font-semibold text-gray-800">
                {order.customer_phone}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">
                Alamat Pengiriman
              </p>

              <p className="font-semibold text-gray-800">
                {order.customer_address}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">
                Catatan Pelanggan
              </p>

              <p className="text-gray-800">
                {order.notes || "Tidak ada catatan."}
              </p>
            </div>
          </div>
        </div>

        {/* Daftar produk */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Produk yang Dipesan
          </h3>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.product_name}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatRupiah(item.price)} × {item.quantity}
                  </p>
                </div>

                <p className="font-bold text-gray-800 whitespace-nowrap">
                  {formatRupiah(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">
                {formatRupiah(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ongkos Kirim</span>
              <span className="font-semibold">
                {formatRupiah(order.shipping_cost)}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="font-bold text-gray-800">
                Total Pembayaran
              </span>

              <span className="text-xl font-bold text-green-800">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Bukti pembayaran */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Bukti Pembayaran
          </h3>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">
              Metode Pembayaran
            </p>

            <p className="font-semibold text-gray-800">
              {order.payment_method === "transfer"
                ? "Transfer Bank"
                : order.payment_method}
            </p>
          </div>

          {proofImage ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-700 font-semibold text-sm">
                  Bukti transfer sudah diunggah
                </span>
              </div>

              <button
                onClick={() => setShowProof(!showProof)}
                className="text-sm font-semibold text-green-700 underline"
              >
                {showProof
                  ? "Sembunyikan bukti"
                  : "Lihat bukti transfer"}
              </button>

              {showProof && (
                <div className="mt-4">
                  <a
                    href={proofImage}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-green-700 underline"
                  >
                    Buka gambar di tab baru
                  </a>

                  <img
                    src={proofImage}
                    alt="Bukti transfer pelanggan"
                    className="mt-3 max-w-full max-h-[600px] rounded-xl border border-gray-200 object-contain"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Waktu unggah:{" "}
                {formatDate(order.payment_proof_uploaded_at)}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Pelanggan belum mengunggah bukti transfer.
              </p>
            </div>
          )}
        </div>

        {/* Verifikasi pembayaran */}
        {canVerify && (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Verifikasi Pembayaran
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Periksa bukti transfer dan pastikan dana sudah
              diterima dengan nominal yang sesuai sebelum
              mengonfirmasi pembayaran.
            </p>

            <div className="bg-green-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600">
                Nominal yang harus diterima
              </p>

              <p className="text-2xl font-bold text-green-800 mt-1">
                {formatRupiah(order.total_amount)}
              </p>
            </div>

            <button
              onClick={verifyPayment}
              disabled={isProcessing}
              className="w-full mt-5 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {verifying
                ? "Sedang Memverifikasi..."
                : "✓ Verifikasi Pembayaran"}
            </button>
          </div>
        )}

        {/* Pengelolaan status pesanan */}
        {["paid", "processing", "shipped"].includes(order.status) && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Perbarui Status Pesanan
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Setelah pembayaran dikonfirmasi, admin dapat memperbarui
              perkembangan pesanan secara bertahap.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600">Status saat ini</p>
              <p className="font-bold text-blue-900 mt-1">
                {order.status === "paid"
                  ? "Sudah Dibayar"
                  : order.status === "processing"
                    ? "Sedang Diproses"
                    : "Sedang Dikirim"}
              </p>
            </div>

            <button
              onClick={advanceOrderStatus}
              disabled={isProcessing}
              className="w-full mt-5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {updatingStatus
                ? "Sedang Memperbarui..."
                : order.status === "paid"
                  ? "Mulai Proses Pesanan"
                  : order.status === "processing"
                    ? "Tandai Pesanan Sedang Dikirim"
                    : "Tandai Pesanan Selesai"}
            </button>

            <p className="text-xs text-gray-400 mt-3">
              Status hanya dapat dilanjutkan satu tahap dalam satu waktu.
            </p>
          </div>
        )}

        {/* Pembatalan pesanan */}
        {canCancel && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Pembatalan Pesanan
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Admin dapat membatalkan pesanan yang masih
              berstatus menunggu pembayaran.
            </p>

            {proofImage && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold text-yellow-800">
                  Perhatian!
                </p>

                <p className="text-sm text-yellow-700 mt-1">
                  Pelanggan sudah mengunggah bukti transfer.
                  Pastikan dana belum diterima sebelum
                  membatalkan pesanan.
                </p>
              </div>
            )}

            <button
              onClick={cancelOrder}
              disabled={isProcessing}
              className="w-full mt-5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {cancelling
                ? "Sedang Membatalkan..."
                : "✕ Batalkan Pesanan"}
            </button>

            <p className="text-xs text-gray-400 mt-3">
              Pembatalan hanya tersedia untuk pesanan yang
              masih menunggu pembayaran.
            </p>
          </div>
        )}

        {/* Informasi status */}
        {order.status === "paid" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-5">
            <p className="font-bold text-green-800">
              ✓ Pembayaran telah diverifikasi.
            </p>

            <p className="text-sm text-green-700 mt-1">
              Pesanan ini sudah berstatus lunas.
            </p>
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-5">
            <p className="font-bold text-red-800">
              ✕ Pesanan telah dibatalkan.
            </p>

            <p className="text-sm text-red-700 mt-1">
              Pesanan ini tidak dapat diverifikasi melalui
              proses normal.
            </p>
          </div>
        )}

        {order.status === "pending" && !proofImage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-5">
            <p className="font-semibold text-yellow-800">
              Menunggu bukti pembayaran.
            </p>

            <p className="text-sm text-yellow-700 mt-1">
              Tombol verifikasi akan tersedia setelah pelanggan
              mengunggah bukti transfer.
            </p>
          </div>
        )}

        {/* Tombol kembali */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/admin/orders")}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Kembali ke Daftar Pesanan
          </button>
        </div>
      </main>
    </div>
  );
}
