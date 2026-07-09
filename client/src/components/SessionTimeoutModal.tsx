interface Props {
  open: boolean;
  onStay: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({ open, onStay, onLogout }: Props) {
  if (!open) return null;

  return (
    <div
      className="
      fixed inset-0
      bg-black/40
      flex items-center
      justify-center
      z-50
    "
    >
      <div
        className="
        bg-white
        rounded-xl
        p-6
        w-100
      "
      >
        <h2 className="text-xl font-bold">Session Expiring</h2>

        <p className="mt-2 text-gray-600">
          Your session will expire in 5 minutes due to inactivity.
        </p>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onStay}
            className="
            flex-1
            bg-blue-600
            text-white
            py-2
            rounded
          "
          >
            Stay Logged In
          </button>

          <button
            onClick={onLogout}
            className="
            flex-1
            bg-gray-200
            py-2
            rounded
          "
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
