
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API_URL =
  "http://localhost/dapure-jadule-api/api/admin-auth.php";

export default function AdminProtected({ children }) {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const checkAdminSession = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (response.status === 401) {
            if (isMounted) {
              setStatus("unauthorized");
            }
            return;
          }

          throw new Error(
            result.message || "Gagal memeriksa session admin."
          );
        }

        if (isMounted) {
          setStatus("authorized");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setStatus("error");
        }
      }
    };

    checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            Memeriksa session admin...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-7 rounded-xl shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-700 mb-3">
            Gagal Memeriksa Session
          </h2>

          <p className="text-gray-600 mb-5">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-green-800 hover:bg-green-900 text-white px-5 py-2 rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return children;
}
