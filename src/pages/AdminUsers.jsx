
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost/dapure-jadule-api/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export default function AdminUsers() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [updatingId, setUpdatingId] = useState(null);

  const fetchAdmins = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin-list-admins.php`,
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

      if (response.status === 403) {
        throw new Error(
          "Kamu tidak memiliki akses mengelola akun admin."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil daftar admin."
        );
      }

      setAdmins(result.data || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("Semua kolom wajib diisi.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/admin-create-admin.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
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
          result.message || "Gagal membuat akun admin."
        );
      }

      setSuccess("Akun admin berhasil ditambahkan.");
      setForm(initialForm);
      setShowForm(false);

      await fetchAdmins(true);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const nextStatus = Number(admin.is_active) === 1 ? 0 : 1;

    const confirmation = window.confirm(
      nextStatus === 0
        ? `Yakin ingin menonaktifkan akun ${admin.name}?`
        : `Yakin ingin mengaktifkan kembali akun ${admin.name}?`
    );

    if (!confirmation) return;

    setError("");
    setSuccess("");
    setUpdatingId(admin.id);

    try {
      const response = await fetch(
        `${API_URL}/admin-update-admin-status.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_id: admin.id,
            is_active: nextStatus,
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
          result.message || "Gagal mengubah status akun."
        );
      }

      setSuccess(result.message);
      await fetchAdmins(true);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(
      date.replace(" ", "T")
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const activeCount = admins.filter(
    (admin) => Number(admin.is_active) === 1
  ).length;

  const superAdminCount = admins.filter(
    (admin) => admin.role === "super_admin"
  ).length;

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
              Manajemen Akun Admin
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-green-700">
              DAPURE JADULE ADMIN
            </p>

            <h2 className="text-3xl font-bold text-gray-800 mt-1">
              Manajemen Admin
            </h2>

            <p className="text-gray-500 mt-2">
              Kelola akun administrator toko Dapure Jadule.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing || loading}
              className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-4 py-3 rounded-lg font-semibold transition"
            >
              {refreshing ? "Memperbarui..." : "↻ Refresh"}
            </button>

            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowForm(!showForm);
              }}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-lg font-semibold transition"
            >
              {showForm ? "Tutup Form" : "+ Tambah Admin"}
            </button>
          </div>
        </div>

        {/* Notifikasi */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5">
            <p className="font-semibold">Terjadi kesalahan</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-5">
            {success}
          </div>
        )}

        {/* Form Tambah Admin */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Tambah Akun Admin
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Akun baru otomatis mendapatkan role Admin.
            </p>

            <form onSubmit={handleCreateAdmin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Admin
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="Masukkan nama admin"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Admin
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    maxLength={150}
                    placeholder="admin@email.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password Awal
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    Password akan disimpan dalam bentuk hash.
                    Admin dapat meminta Super Admin menggantinya
                    jika lupa.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  {saving ? "Menyimpan..." : "Simpan Admin"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(initialForm);
                  }}
                  disabled={saving}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Statistik Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Total Akun Admin
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              {loading ? "..." : admins.length}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Akun Aktif
            </p>
            <h3 className="text-3xl font-bold text-green-700 mt-2">
              {loading ? "..." : activeCount}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Akun Super Admin
            </p>
            <h3 className="text-3xl font-bold text-purple-700 mt-2">
              {loading ? "..." : superAdminCount}
            </h3>
          </div>
        </div>

        {/* Daftar Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">
              Daftar Akun Admin
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Semua akun yang terdaftar di sistem.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Memuat daftar admin...
            </div>
          ) : admins.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Belum ada akun admin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tanggal Dibuat</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">
                          {admin.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {admin.email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {admin.role === "super_admin" ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            Admin
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {Number(admin.is_active) === 1 ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(admin.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        {admin.role === "super_admin" ? (
                          <span className="text-xs text-gray-400">
                            Akun khusus
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            disabled={updatingId === admin.id}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                              Number(admin.is_active) === 1
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {updatingId === admin.id
                              ? "Memproses..."
                              : Number(admin.is_active) === 1
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Informasi */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h4 className="font-bold text-blue-800">
            Informasi Pengelolaan Admin
          </h4>

          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc pl-5">
            <li>Hanya Super Admin yang dapat mengelola akun.</li>
            <li>Akun baru otomatis menjadi Admin biasa.</li>
            <li>Akun nonaktif tidak dapat login.</li>
            <li>Akun tidak dihapus agar riwayat tetap tersimpan.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
