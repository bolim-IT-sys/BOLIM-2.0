import { useState, useEffect } from "react";
import { Plus, Pencil, UserX, ShieldCheck, User } from "lucide-react";
import { Modal } from "../modals/Modal";

type User = {
  id: number;
  username: string;
  role: string;
  active: boolean;
};

type Module = {
  id: number;
  code: string;
  name: string;
};

export default function UserManagementPage() {
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          role: "USER",
          moduleIds: selectedModules,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      alert("User created successfully");

      setUsername("");
      setPassword("");
      setSelectedModules([]);

      setIsWelcomeModalOpen(false);

      await loadUsers();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChange = (moduleId: number) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const loadUsers = async () => {
    const token = localStorage.getItem("accessToken");

    const response = await fetch("http://localhost:3000/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    setUsers(Array.isArray(data) ? data : []);
  };

  const loadModules = async () => {
    const token = localStorage.getItem("accessToken");

    const response = await fetch("http://localhost:3000/api/modules", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    setModules(data);
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadUsers(), loadModules()]);
    };

    initialize();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Manage system administrators, permissions, and internal workspace
            access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWelcomeModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm shadow-indigo-600/10 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Create User</span>
        </button>
      </div>

      {/* --- REFINED TABLE WRAPPER --- */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Username / Identity</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  {/* User Profile Column */}
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      {/* Avatar generation */}
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0
                        ${
                          user.role === "SUPER_ADMIN" || user.role === "ADMIN"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                          {user.username}
                        </span>
                        <span className="text-xs font-medium text-slate-400 block -mt-0.5">
                          ID: #{user.id.toString().padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role Type Column */}
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      {user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? (
                        <ShieldCheck size={16} className="text-indigo-500" />
                      ) : (
                        <User size={16} className="text-slate-400" />
                      )}
                      <span className="text-xs font-bold font-mono tracking-wide bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {user.role}
                      </span>
                    </div>
                  </td>

                  {/* Operational Status Column */}
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors
                        ${
                          user.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border-rose-200/60"
                        }`}
                    >
                      {/* Status indicator dot */}
                      <span
                        className={`h-1.5 w-1.5 rounded-full block
                        ${user.active ? "bg-emerald-500" : "bg-rose-500"}`}
                      />
                      {user.active ? "Active" : "Disabled"}
                    </span>
                  </td>

                  {/* Dashboard Operations Action Column */}
                  <td className="p-4 pr-6">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Edit User Info"
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
                      >
                        <Pencil size={16} strokeWidth={2.2} />
                      </button>

                      <button
                        type="button"
                        title="Deactivate Account"
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                      >
                        <UserX size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- DYNAMIC DATA LENGTH CHECK --- */}
        {users.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium">
            No system accounts currently mapped into database modules.
          </div>
        )}
      </div>

      <Modal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        title="Create New User"
        size="md" // Changed from 'lg' to 'md' so a simple form doesn't look empty/stretched
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Module Permissions Checkboxes */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Module Permissions
            </label>
            <p className="text-xs text-slate-400 -mt-1 mb-1">
              Select which workspace modules this user can access.
            </p>

            {/* Grid wrapper splits options into 2 neat columns */}
            <div className="grid grid-cols-2 gap-3">
              {modules.map((module) => (
                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedModules.includes(module.id)}
                    onChange={() => handleModuleChange(module.id)}
                  />
                  <span className="text-sm font-medium text-slate-700 select-none capitalize">
                    {module.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Action Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => setIsWelcomeModalOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-indigo-600/10 transition-colors"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
