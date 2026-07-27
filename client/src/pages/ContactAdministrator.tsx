import forgot from "../assets/undraw_forgot-password.svg";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ContactAdministrator = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 transition-all duration-300 hover:shadow-2xl">
        {/* Illustration */}
        <div className="mb-6 flex justify-center">
          <img
            src={forgot}
            alt="Forgot Password Illustration"
            className="w-40 h-40 object-contain drop-shadow-sm"
          />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
          Forgot Your Password?
        </h2>

        {/* Primary Message */}
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          Please contact your{" "}
          <span className="font-semibold text-slate-700">
            System Administrator
          </span>{" "}
          to have your password securely reset.
        </p>

        {/* Secondary Note / Helper Text */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 mb-6 text-left">
          <p className="text-xs text-amber-800 leading-relaxed flex items-start gap-2">
            <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Only authorized administrators have the permissions required to
              reset user passwords.
            </span>
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/login/`)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors duration-200 shadow-sm shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ContactAdministrator;
