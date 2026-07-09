import React, { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  role: string;
  active: boolean;
}

const Hero: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch("http://localhost:3000/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data: User = await response.json();
        setUser(data);
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
          Welcome, {user?.username ?? "User"}!
        </h1>

        <div className="mt-8 text-sm text-white/60">
          © 2026 Bolim Philippines
        </div>
      </div>
    </div>
  );
};

export default Hero;
