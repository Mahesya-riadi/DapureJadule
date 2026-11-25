
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost/dapure-jadule-api/api";

const initialStats = {
  total_orders: 0,
  pending_orders: 0,
  paid_orders: 0,
  total_products: 0,
  total_revenue: 0,
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [adminRole, setAdminRole] = useState("");

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin-stats.php`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil statistik."
        );
      }

      setStats(result.data);
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAdminRole = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin-auth.php`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      if (response.ok && result.success) {
        setAdminRole(result.data.role || "admin");
      }
    } catch (err) {
      console.error("Gagal mengambil role admin:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAdminRole();
  }, []);

  const handleLogout = async () => {
    const confirmation = window.confirm(
      "Apakah kamu yakin ingin keluar dari dashboard admin?"
    );

    if (!confirmation) return;

    try {
      const response = await fetch(
        `${API_URL}/admin-logout.php`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Logout gagal.");
      }

      navigate("/admin/login", {
        replace: true,
      });
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat logout.");
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number || 0);
  };

  const cards = [
    {
      title: "Total Pesanan",
      value: stats.total_orders,
      icon: "🛍️",
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Menunggu Pembayaran",
      value: stats.pending_orders,
      icon: "⏳",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "Pesanan Dibayar",
      value: stats.paid_orders,
      icon: "✅",
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Produk Aktif",
      value: stats.total_products,
      icon: "📦",
      color: "bg-purple-100 text-purple-700",
    },
  ];

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
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-5 py-8">
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-green-700">
              DAPURE JADULE ADMIN
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              Dashboard
            </h2>

            <p className="text-gray-500 mt-2">
              Pantau aktivitas toko Dapure Jadule di sini.
            </p>
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            {refreshing ? "Memperbarui..." : "↻ Refresh Data"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <p className="font-semibold">
              Gagal mengambil data
            </p>

            <p className="text-sm mt-1">{error}</p>

            <button
              onClick={() => fetchStats()}
              className="text-sm font-bold underline mt-2"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {card.title}
                  </p>

                  <h3 className="text-3xl font-bold text-gray-800 mt-3">
                    {loading ? "..." : card.value}
                  </h3>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.color}`}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Pendapatan */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
              💰
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Pendapatan
              </p>

              <h3 className="text-2xl sm:text-3xl font-bold text-green-800 mt-1">
                {loading
                  ? "Memuat..."
                  : formatRupiah(stats.total_revenue)}
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Dihitung dari pesanan dengan status paid.
              </p>
            </div>
          </div>
        </div>

        {/* Menu Navigasi Admin */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Menu Administrasi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Manajemen Pesanan */}
            <button
              onClick={() => navigate("/admin/orders")}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-left hover:shadow-md hover:border-green-400 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-3xl">
                    📋
                  </div>

                  <div>
                    <h4 className="font-bold text-lg text-gray-800 group-hover:text-green-700">
                      Manajemen Pesanan
                    </h4>

                    <p className="text-sm text-gray-500 mt-1">
                      Lihat dan kelola transaksi pelanggan.
                    </p>
                  </div>
                </div>

                <span className="text-2xl text-gray-400 group-hover:text-green-700">
                  →
                </span>
              </div>
            </button>

            {/* Manajemen Produk */}
            <button
              onClick={() => navigate("/admin/products")}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-left hover:shadow-md hover:border-purple-400 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-3xl">
                    📦
                  </div>

                  <div>
                    <h4 className="font-bold text-lg text-gray-800 group-hover:text-purple-700">
                      Manajemen Produk
                    </h4>

                    <p className="text-sm text-gray-500 mt-1">
                      Lihat dan kelola produk toko.
                    </p>
                  </div>
                </div>

                <span className="text-2xl text-gray-400 group-hover:text-purple-700">
                  →
                </span>
              </div>
            </button>

            {/* Manajemen Admin - Super Admin saja */}
            {adminRole === "super_admin" && (
              <button
                onClick={() => navigate("/admin/users")}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-left hover:shadow-md hover:border-blue-400 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-3xl">
                      👥
                    </div>

                    <div>
                      <h4 className="font-bold text-lg text-gray-800 group-hover:text-blue-700">
                        Manajemen Admin
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        Tambah dan kelola akun administrator.
                      </p>
                    </div>
                  </div>

                  <span className="text-2xl text-gray-400 group-hover:text-blue-700">
                    →
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Informasi Dashboard */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800">
            Informasi Dashboard
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Dashboard sudah terhubung dengan database MySQL.
            Data statistik diambil melalui API PHP yang hanya
            dapat diakses oleh admin yang sudah login.
          </p>
        </div>
      </main>
    </div>
  );
}
