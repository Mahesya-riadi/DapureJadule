
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  "http://localhost/dapure-jadule-api/api/admin-login.php";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Login gagal. Silakan coba kembali."
        );
      }

      // Simpan identitas admin hanya di state React.
      // Session autentikasi tetap dikelola oleh PHP.
      navigate("/admin/dashboard", {
        replace: true,
        state: {
          admin: result.data,
        },
      });

    } catch (err) {
      setError(
        err.message || "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] px-4 py-10">

      <div className="w-full max-w-md">

        {/* Logo dan identitas */}
        <div className="text-center mb-8">

          <div className="w-16 h-16 bg-green-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">
              D
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            Dapure Jadule
          </h1>

          <p className="text-gray-500 mt-2">
            Administrator Dashboard
          </p>

        </div>

        {/* Card Login */}
        <div className="bg-white rounded-2xl shadow-xl p-7 sm:p-9">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-800">
              Selamat Datang!
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Silakan login untuk mengelola toko Dapure Jadule.
            </p>

          </div>

          {/* Notifikasi error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="mb-5">

              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Admin
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Masukkan email admin"
                autoComplete="username"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition"
                required
              />

            </div>

            {/* Password */}
            <div className="mb-6">

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-800 hover:text-green-600"
                >
                  {showPassword ? "Sembunyi" : "Lihat"}
                </button>

              </div>

            </div>

            {/* Tombol login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 hover:bg-green-900 disabled:bg-green-500 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md"
            >
              {loading ? "Sedang Login..." : "Login Admin"}
            </button>

          </form>

          <div className="border-t border-gray-100 mt-7 pt-5 text-center">

            <p className="text-xs text-gray-400">
              Halaman khusus administrator Dapure Jadule
            </p>

          </div>

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 Dapure Jadule
        </p>

      </div>

    </div>
  );
}
