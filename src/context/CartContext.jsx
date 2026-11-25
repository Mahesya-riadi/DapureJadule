import { createContext, useContext, useRef, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null);
  const notificationTimer = useRef(null);

  // Membersihkan timer notifikasi ketika provider dilepas.
  useEffect(() => {
    return () => {
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }
    };
  }, []);

  // NOTIFIKASI
  function showNotification(message) {
    setNotification(message);

    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
    }

    notificationTimer.current = setTimeout(() => {
      setNotification(null);
      notificationTimer.current = null;
    }, 3000);
  }

  // Mengubah nilai stok menjadi angka yang aman.
  function getAvailableStock(product) {
    const stock = Number(product?.stock);
    return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
  }

  // MENAMBAHKAN PRODUK
  function addToCart(product) {
    const availableStock = getAvailableStock(product);

    if (availableStock <= 0) {
      showNotification(`${product.name} sedang habis dan tidak bisa ditambahkan.`);
      return;
    }

    const existingProduct = cart.find(
      (item) => String(item.id) === String(product.id)
    );

    if (existingProduct) {
      if (existingProduct.quantity >= availableStock) {
        showNotification(`Stok ${product.name} hanya tersedia ${availableStock}.`);
        return;
      }

      setCart((currentCart) =>
        currentCart.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                stock: availableStock,
                quantity: Math.min(item.quantity + 1, availableStock),
              }
            : item
        )
      );
    } else {
      setCart((currentCart) => [
        ...currentCart,
        { ...product, stock: availableStock, quantity: 1 },
      ]);
    }

    showNotification(`${product.name} berhasil ditambahkan ke keranjang!`);
  }

  // MEMPERBARUI STOK KERANJANG DARI DATA PRODUK TERBARU
  function updateCartStock(products) {
    const stockById = new Map(
      products.map((product) => [String(product.id), getAvailableStock(product)])
    );

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (!stockById.has(String(item.id))) {
          return { ...item, stock: 0 };
        }

        return { ...item, stock: stockById.get(String(item.id)) };
      })
    );
  }

  // MENAMBAH JUMLAH
  function increaseQuantity(id) {
    const selectedProduct = cart.find(
      (item) => String(item.id) === String(id)
    );

    if (!selectedProduct) return;

    const availableStock = getAvailableStock(selectedProduct);

    if (selectedProduct.quantity >= availableStock) {
      showNotification(
        availableStock <= 0
          ? `${selectedProduct.name} sedang habis.`
          : `Stok ${selectedProduct.name} hanya tersedia ${availableStock}.`
      );
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        String(item.id) === String(id)
          ? { ...item, quantity: Math.min(item.quantity + 1, getAvailableStock(item)) }
          : item
      )
    );
  }

  // MENGURANGI JUMLAH
  function decreaseQuantity(id) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          String(item.id) === String(id)
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // MENGHAPUS PRODUK
  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => String(item.id) !== String(id))
    );

    showNotification("Produk berhasil dihapus dari keranjang.");
  }

  // TOTAL PRODUK
  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // TOTAL HARGA
  const totalPrice = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        updateCartStock,
        totalItems,
        totalPrice,
        notification,
        setNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
