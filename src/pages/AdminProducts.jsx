
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost/dapure-jadule-api/api";
const API_BASE_URL = "http://localhost/dapure-jadule-api";

const initialForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // State modal dan form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);

  // State gambar
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // State proses penyimpanan
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [togglingProductId, setTogglingProductId] = useState(null);

  // Mengambil data produk
  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin-products.php`,
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
          result.message || "Gagal mengambil data produk."
        );
      }

      setProducts(result.data || []);
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat mengambil produk."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Preview gambar yang baru dipilih
  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  // Format rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(number) || 0);
  };

  // Mengubah path gambar menjadi URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `http://localhost${imagePath}`;
    }

    return `${API_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
  };

  // Pencarian produk
  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword)
      );
    });
  }, [products, search]);

  // Statistik produk
  const activeProducts = products.filter(
    (product) => Number(product.is_active) === 1
  ).length;

  const inactiveProducts = products.length - activeProducts;

  // Statistik stok produk
  const lowStockProducts = products.filter(
    (product) => Number(product.stock) >= 1 && Number(product.stock) <= 5
  ).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  // Mengubah input form
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Memilih gambar
  const handleImageChange = (e) => {
    const selectedImage = e.target.files?.[0];

    if (!selectedImage) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedImage.type)) {
      setFormError("Format gambar harus JPG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    if (selectedImage.size > 2 * 1024 * 1024) {
      setFormError("Ukuran gambar maksimal 2 MB.");
      e.target.value = "";
      return;
    }

    setFormError("");
    setImage(selectedImage);
  };

  // Reset form
  const resetForm = () => {
    setForm(initialForm);
    setImage(null);
    setEditingProduct(null);
    setFormError("");
  };

  // Membuka form tambah produk
  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // Membuka form edit produk
  const openEditForm = (product) => {
    resetForm();

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });

    setShowForm(true);
  };

  // Validasi form
  const validateForm = () => {
    if (!form.name.trim()) {
      return "Nama produk wajib diisi.";
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      return "Harga harus berupa angka lebih dari 0.";
    }

    if (
      form.stock === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      return "Stok harus berupa bilangan bulat minimal 0.";
    }

    // Foto wajib hanya ketika menambah produk
    if (!editingProduct && !image) {
      return "Silakan pilih foto produk terlebih dahulu.";
    }

    return "";
  };

  // Menyimpan produk: tambah atau edit
  const handleSubmitProduct = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("price", form.price);
    formData.append("stock", form.stock);

    let endpoint = "admin-add-product.php";

    if (editingProduct) {
      endpoint = "admin-edit-product.php";

      formData.append("id", editingProduct.id);
    }

    // Gambar hanya dikirim jika dipilih
    if (image) {
      formData.append("image", image);
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/${endpoint}`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Terjadi kesalahan saat menyimpan produk."
        );
      }

      const action = editingProduct ? "diperbarui" : "ditambahkan";

      setSuccessMessage(
        `Produk "${result.data.name}" berhasil ${action}.`
      );

      setShowForm(false);
      resetForm();

      await fetchProducts(true);
    } catch (err) {
      setFormError(
        err.message || "Terjadi kesalahan saat menyimpan produk."
      );
    } finally {
      setSaving(false);
    }
  };

  // Mengaktifkan atau menonaktifkan produk
  const handleToggleStatus = async (product) => {
    const currentlyActive = Number(product.is_active) === 1;
    const nextStatus = currentlyActive ? 0 : 1;
    const action = currentlyActive ? "menonaktifkan" : "mengaktifkan";

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin ${action} produk "${product.name}"?`
    );

    if (!confirmed) return;

    setSuccessMessage("");
    setError("");
    setTogglingProductId(product.id);

    try {
      const formData = new FormData();
      formData.append("id", product.id);
      formData.append("is_active", String(nextStatus));

      const response = await fetch(
        `${API_URL}/admin-toggle-product.php`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengubah status produk."
        );
      }

      setSuccessMessage(result.message || "Status produk berhasil diperbarui.");
      await fetchProducts(true);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengubah status produk.");
    } finally {
      setTogglingProductId(null);
    }
  };

  // Menutup modal
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

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
              Manajemen Produk
            </h2>

            <p className="text-gray-500 mt-2">
              Lihat dan kelola seluruh produk toko.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchProducts(true)}
              disabled={refreshing || loading}
              className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 px-4 py-3 rounded-lg font-semibold transition"
            >
              {refreshing ? "Memperbarui..." : "↻ Refresh"}
            </button>

            <button
              onClick={openAddForm}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-lg font-semibold transition"
            >
              + Tambah Produk
            </button>
          </div>
        </div>

        {/* Notifikasi berhasil */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 flex justify-between gap-3">
            <p className="text-sm font-semibold">
              ✓ {successMessage}
            </p>

            <button
              onClick={() => setSuccessMessage("")}
              className="font-bold"
              aria-label="Tutup notifikasi"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Total Seluruh Produk
            </p>

            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              {loading ? "..." : products.length}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Produk Aktif
            </p>

            <h3 className="text-3xl font-bold text-green-700 mt-2">
              {loading ? "..." : activeProducts}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Produk Nonaktif
            </p>

            <h3 className="text-3xl font-bold text-red-600 mt-2">
              {loading ? "..." : inactiveProducts}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Stok Menipis (1–5)
            </p>

            <h3 className="text-3xl font-bold text-yellow-600 mt-2">
              {loading ? "..." : lowStockProducts}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Produk perlu segera ditambah stoknya.</p>
          </div>

          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Stok Habis (0)
            </p>

            <h3 className="text-3xl font-bold text-red-600 mt-2">
              {loading ? "..." : outOfStockProducts}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Produk tidak memiliki stok tersedia.</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <p className="font-semibold">
              Gagal mengambil data produk
            </p>

            <p className="text-sm mt-1">{error}</p>

            <button
              onClick={() => fetchProducts()}
              className="text-sm font-bold underline mt-2"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Daftar Produk */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Daftar Produk
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Data produk yang tersimpan di database.
                </p>
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama produk..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Memuat data produk...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📦</div>

              <p className="font-semibold text-gray-700">
                Produk tidak ditemukan
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Coba gunakan kata pencarian lain.
              </p>
            </div>
          ) : (
            <>
              {/* Tampilan Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-4">No.</th>
                      <th className="px-6 py-4">Produk</th>
                      <th className="px-6 py-4">Harga</th>
                      <th className="px-6 py-4">Stok</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-gray-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  🍽️
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-800">
                                {product.name}
                              </p>

                              <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {product.description || "Tidak ada deskripsi"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-700">
                          {formatRupiah(product.price)}
                        </td>

                        <td className="px-6 py-4">
                          {Number(product.stock) === 0 ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-bold text-red-700">0</span>
                              <span className="inline-block bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                Habis
                              </span>
                            </div>
                          ) : Number(product.stock) <= 5 ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-bold text-yellow-700">{product.stock}</span>
                              <span className="inline-block bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                                Menipis
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-semibold text-gray-700">{product.stock}</span>
                              <span className="inline-block bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                Aman
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {Number(product.is_active) === 1 ? (
                            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditForm(product)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold transition"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              onClick={() => handleToggleStatus(product)}
                              disabled={togglingProductId === product.id}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                Number(product.is_active) === 1
                                  ? "bg-red-50 hover:bg-red-100 text-red-700"
                                  : "bg-green-50 hover:bg-green-100 text-green-700"
                              }`}
                            >
                              {togglingProductId === product.id
                                ? "Memproses..."
                                : Number(product.is_active) === 1
                                  ? "Nonaktifkan"
                                  : "Aktifkan"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tampilan Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredProducts.map((product, index) => (
                  <div key={product.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.image ? (
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🍽️
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-xs text-gray-400">
                          Produk #{index + 1}
                        </p>

                        <h4 className="font-bold text-gray-800 mt-1">
                          {product.name}
                        </h4>

                        <p className="text-sm text-gray-500 mt-1">
                          {product.description || "Tidak ada deskripsi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Harga</p>
                        <p className="font-bold text-green-700">
                          {formatRupiah(product.price)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500">Stok</p>
                        <p className={`font-bold ${
                          Number(product.stock) === 0
                            ? "text-red-700"
                            : Number(product.stock) <= 5
                              ? "text-yellow-700"
                              : "text-green-700"
                        }`}>
                          {product.stock}
                        </p>
                        <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          Number(product.stock) === 0
                            ? "bg-red-100 text-red-700"
                            : Number(product.stock) <= 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-700"
                        }`}>
                          {Number(product.stock) === 0
                            ? "Habis"
                            : Number(product.stock) <= 5
                              ? "Menipis"
                              : "Aman"}
                        </span>
                      </div>

                      {Number(product.is_active) === 1 ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Aktif
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Nonaktif
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={() => openEditForm(product)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-bold transition"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleToggleStatus(product)}
                        disabled={togglingProductId === product.id}
                        className={`px-3 py-3 rounded-lg text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          Number(product.is_active) === 1
                            ? "bg-red-50 hover:bg-red-100 text-red-700"
                            : "bg-green-50 hover:bg-green-100 text-green-700"
                        }`}
                      >
                        {togglingProductId === product.id
                          ? "Memproses..."
                          : Number(product.is_active) === 1
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Menampilkan {filteredProducts.length} dari {products.length} produk.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL TAMBAH DAN EDIT PRODUK */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl my-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {editingProduct
                    ? "Ubah informasi produk yang ingin diperbarui."
                    : "Lengkapi informasi produk di bawah ini."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-40"
                aria-label="Tutup form"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmitProduct}
              className="p-5 space-y-5"
            >
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

              {/* Nama Produk */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Produk *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  maxLength={150}
                  required
                  placeholder="Contoh: Pempek Panggang"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi Produk
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  maxLength={5000}
                  rows={3}
                  placeholder="Tuliskan deskripsi produk..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 resize-y"
                />
              </div>

              {/* Harga dan Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga (Rp) *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    min="1"
                    step="1"
                    required
                    placeholder="15000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stok Produk *
                  </label>

                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleFormChange}
                    min="0"
                    step="1"
                    required
                    placeholder="20"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto Produk {editingProduct ? "(Opsional)" : "*"}
                </label>

                <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-green-500 transition">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <div className="text-3xl mb-2">📷</div>

                  <p className="font-semibold text-gray-700">
                    Klik untuk memilih foto
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, atau WEBP. Maksimal 2 MB.
                  </p>
                </label>

                {/* Preview gambar baru */}
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Preview Foto Baru
                    </p>

                    <div className="relative w-full max-w-xs h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview produk baru"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {image?.name}
                    </p>
                  </div>
                )}

                {/* Foto lama ketika edit */}
                {!imagePreview && editingProduct?.image && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Foto Produk Saat Ini
                    </p>

                    <div className="relative w-full max-w-xs h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={getImageUrl(editingProduct.image)}
                        alt={editingProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Foto lama akan tetap digunakan jika kamu tidak memilih foto baru.
                    </p>
                  </div>
                )}
              </div>

              {/* Tombol Form */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-5 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold transition disabled:bg-green-400"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingProduct
                      ? "Simpan Perubahan"
                      : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
