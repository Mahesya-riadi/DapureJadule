
import { useCart } from "../context/CartContext";

export default function CartNotification() {
  const { notification, setNotification } = useCart();

  if (!notification) return null;

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-2rem)] max-w-sm animate-[slideIn_0.3s_ease-out]">

      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-white p-4 shadow-xl">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5 12 4 4L19 6"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-800">
            Berhasil!
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {notification}
          </p>

          <p className="mt-2 text-xs font-semibold text-green-600">
            Produk sudah masuk ke keranjang.
          </p>
        </div>

        <button
          onClick={() => setNotification(null)}
          className="text-gray-400 transition hover:text-gray-700"
          aria-label="Tutup notifikasi"
        >
          ✕
        </button>

      </div>
    </div>
  );
}
