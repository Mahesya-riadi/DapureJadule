
export default function Footer() {
  return (
    <footer className="bg-gray-900 px-4 py-8 text-center text-white">
      <h2 className="text-xl font-bold text-orange-400">
        Dapure Jadule
      </h2>

      <p className="mt-2 text-sm text-gray-300">
        Cita Rasa Pempek Khas Palembang
      </p>

      <p className="mt-4 text-xs text-gray-400">
        © {new Date().getFullYear()} Dapure Jadule. All rights reserved.
      </p>
    </footer>
  );
}
