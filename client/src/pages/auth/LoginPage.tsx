import { useState } from "react";
import { Eye, EyeOff, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import LanguageButton from "../../components/LanguageBtn";
import axios from "axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        username,
        password,
        rememberMe,
      });

      const data = response.data;

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("rememberMe", rememberMe ? "true" : "false");

      //console.log("Login successful:", data);

      navigate("/hero");
    } catch (error: unknown) {
      console.error("Login Error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.response?.data) {
          setError(
            typeof error.response.data === "string"
              ? error.response.data
              : "Invalid Credentials",
          );
        } else {
          setError("Login failed. Please check your connection.");
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-500 flex">
      {/*change bg to image bg-[url('/bolim_image.png')] bg-cover bg-center*/}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Monitor size={28} />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="text-slate-500 mt-2">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  //placeholder="admin@company.com" previously email
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <LanguageButton />

                <button
                  type="button"
                  onClick={() => navigate(`/forgot-password/`)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </button>
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700c text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-xs text-slate-500">
                BOLIM Inventory Management System
              </p>

              <p className="text-xs text-slate-400 mt-1">Version 2.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
