
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

  const navLinkClass = ({ isActive }) =>
    `transition-colors duration-200 ${
      isActive
        ? "text-orange-600 font-semibold"
        : "text-gray-600 hover:text-orange-600"
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="text-xl font-bold text-orange-600"
        >
          Dapure Jadule
        </Link>

        {/* Menu Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/pemesanan" className={navLinkClass}>
            Pemesanan
          </NavLink>

          <NavLink to="/riwayat-pesanan" className={navLinkClass}>
            Riwayat Pesanan
          </NavLink>

          <NavLink
            to="/keranjang"
            className={({ isActive }) =>
              `${navLinkClass({ isActive })} flex items-center gap-2`
            }
          >
            Keranjang
            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">
              {totalItems}
            </span>
          </NavLink>
        </div>

        {/* Tombol Keranjang dan Hamburger Mobile */}
        <div className="flex items-center gap-4 md:hidden">

          {/* Ikon Keranjang */}
          <Link
            to="/keranjang"
            onClick={closeMenu}
            aria-label={`Buka keranjang, ${totalItems} item`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-orange-50 hover:text-orange-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>

            {/* Badge Jumlah Barang */}
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-600 px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Tombol Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center text-2xl text-gray-700 transition hover:text-orange-600"
            aria-label="Buka atau tutup menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

        </div>
      </nav>

      {/* Menu Mobile */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={navLinkClass}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/pemesanan"
              onClick={closeMenu}
              className={navLinkClass}
            >
              Pemesanan
            </NavLink>

            <NavLink
              to="/keranjang"
              onClick={closeMenu}
              className={navLinkClass}
            >
              Keranjang ({totalItems})
            </NavLink>

            <NavLink
              to="/riwayat-pesanan"
              onClick={closeMenu}
              className={navLinkClass}
            >
              Riwayat Pesanan
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
