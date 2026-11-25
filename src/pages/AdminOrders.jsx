
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  "http://localhost/dapure-jadule-api/api/admin-orders.php";

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil pesanan."
        );
      }

      setOrders(result.data || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        String(order.order_code || "")
          .toLowerCase()
          .includes(keyword) ||
        String(order.customer_name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(order.customer_phone || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(number) || 0);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date.replace(" ", "T")).toLocaleString(
      "id-ID",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getStatus = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "Menunggu Pembayaran",
      paid: "Sudah Dibayar",
      cancelled: "Dibatalkan",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const openOrderDetail = (orderCode) => {
    navigate(
      `/admin/orders/${encodeURIComponent(orderCode)}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
            onClick={() => navigate("/admin/dashboard")}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <p className="text-sm font-semibold text-green-700">
              DAPURE JADULE ADMIN
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              Manajemen Pesanan
            </h2>

            <p className="text-gray-500 mt-2">
              Kelola dan pantau pesanan pelanggan.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-5 py-3 rounded-lg font-semibold"
          >
            {loading ? "Memuat..." : "↻ Refresh Pesanan"}
          </button>
        </div>

        {/* Ringkasan Pesanan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Total Pesanan
            </p>
            <h3 className="text-2xl font-bold mt-2">
              {orders.length}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Menunggu Pembayaran
            </p>
            <h3 className="text-2xl font-bold text-yellow-600 mt-2">
              {orders.filter((o) => o.status === "pending").length}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Sudah Dibayar
            </p>
            <h3 className="text-2xl font-bold text-green-700 mt-2">
              {orders.filter((o) => o.status === "paid").length}
            </h3>
          </div>
        </div>

        {/* Pencarian dan Filter */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode pesanan, nama, atau nomor HP..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">Semua Status</option>
              <option value="pending">
                Menunggu Pembayaran
              </option>
              <option value="paid">Sudah Dibayar</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5">
            {error}
          </div>
        )}

        {/* Tabel Pesanan */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">
              Daftar Transaksi
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {filteredOrders.length} dari{" "}
              {orders.length} pesanan.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Sedang mengambil data pesanan...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Tidak ada pesanan yang ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-4">Kode Pesanan</th>
                    <th className="px-5 py-4">Pelanggan</th>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">
                      Bukti Transfer
                    </th>
                    <th className="px-5 py-4 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-semibold text-green-800 whitespace-nowrap">
                        {order.order_code}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.customer_phone}
                        </p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-5 py-4 font-semibold whitespace-nowrap">
                        {formatRupiah(order.total_amount)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatus(order.status)}
                      </td>

                      <td className="px-5 py-4">
                        {order.payment_proof ? (
                          <span className="text-green-700 font-semibold">
                            Sudah diunggah
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            Belum ada
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() =>
                            openOrderDetail(order.order_code)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
