
import { Routes, Route, useLocation } from "react-router-dom";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartNotification from "./components/CartNotification";
import AdminProtected from "./components/AdminProtected";

// Customer Pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";

export default function App() {
  const location = useLocation();

  // Menentukan apakah halaman yang dibuka merupakan halaman admin
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Komponen khusus halaman pelanggan */}
      {!isAdminPage && <Navbar />}
      {!isAdminPage && <CartNotification />}

      <Routes>
        {/* ========================= */}
        {/* HALAMAN CUSTOMER */}
        {/* ========================= */}

        <Route path="/" element={<Dashboard />} />

        <Route path="/pemesanan" element={<Orders />} />

        <Route path="/keranjang" element={<Cart />} />

        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/riwayat-pesanan"
          element={<OrderHistory />}
        />

        {/* ========================= */}
        {/* HALAMAN ADMIN */}
        {/* ========================= */}

        {/* Login Admin */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* Dashboard Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtected>
              <AdminDashboard />
            </AdminProtected>
          }
        />

        {/* Manajemen Pesanan */}
        <Route
          path="/admin/orders"
          element={
            <AdminProtected>
              <AdminOrders />
            </AdminProtected>
          }
        />

        {/* Detail Pesanan */}
        <Route
          path="/admin/orders/:orderCode"
          element={
            <AdminProtected>
              <AdminOrderDetail />
            </AdminProtected>
          }
        />

        {/* Manajemen Produk */}
        <Route
          path="/admin/products"
          element={
            <AdminProtected>
              <AdminProducts />
            </AdminProtected>
          }
        />

        {/* Manajemen Admin - Super Admin */}
        <Route
          path="/admin/users"
          element={
            <AdminProtected>
              <AdminUsers />
            </AdminProtected>
          }
        />
      </Routes>

      {/* Footer khusus halaman pelanggan */}
      {!isAdminPage && <Footer />}
    </>
  );
}
