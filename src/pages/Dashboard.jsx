
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#FFFDF8] text-[#35251D]">

      {/* HERO SECTION */}
      <section className="px-4 py-20 text-center sm:px-8 md:py-28">

        <p className="mb-4 font-semibold text-orange-700">
          Cita Rasa Khas Palembang
        </p>

        <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          Nikmati Kelezatan
          <br />
          Pempek Khas Palembang
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-gray-600">
          Sajian pempek dengan cita rasa khas,
          dibuat untuk menghadirkan kelezatan
          di setiap gigitan.
        </p>

        <Link
          to="/pemesanan"
          className="inline-block rounded-full bg-[#8B4A2F] px-8 py-3 text-white transition hover:bg-orange-800"
        >
          Lihat Menu
        </Link>

      </section>

      {/* INFORMASI TOKO */}
      <section className="bg-[#FAF5EE] px-4 py-16 sm:px-8">

        <div className="mx-auto max-w-5xl text-center">

          <p className="mb-2 font-semibold text-orange-700">
            Dapure Jadule
          </p>

          <h2 className="mb-5 text-2xl font-bold sm:text-3xl">
            Kelezatan Pempek Khas Palembang
          </h2>

          <p className="mx-auto max-w-2xl leading-relaxed text-gray-600">
            Nikmati berbagai pilihan pempek khas Palembang
            dengan cita rasa yang menggugah selera.
            Temukan menu favoritmu dan lakukan pemesanan
            dengan mudah melalui Dapure Jadule.
          </p>

        </div>

      </section>

    </main>
  );
}
