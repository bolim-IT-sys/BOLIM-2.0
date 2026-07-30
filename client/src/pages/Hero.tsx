import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  role: string;
  active: boolean;
}

const Hero: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await api.get<User>("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
        <div className="mx-auto w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <span className="text-4xl">👋</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">
          {t("hero.welcome", "Welcome,")} {user?.username ?? "User"}!
        </h1>

        <div className="mt-8 text-sm text-white/60">
          {t("hero.copyright", "© 2026 Bolim Philippines")}
        </div>
      </div>
    </div>
  );
};

export default Hero;
