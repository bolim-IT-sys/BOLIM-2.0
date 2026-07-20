import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  UserX,
  ShieldCheck,
  User,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Modal } from "../modals/Modal";
import api from "../api/axios";
import { isAxiosError } from "axios";

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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  // Selection States for Modifying Profiles
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to read user index lists:", error);
    }
  };

  const loadModules = async () => {
    try {
      const response = await api.get("/modules");
      setModules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to read server module data:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadUsers(), loadModules()]);
    };
    initialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingUser) {
        const payload = {
          username,
          password,
          role: editingUser.role,
          moduleIds: selectedModules,
        };
        await api.put(`/users/${editingUser.id}`, payload);
        alert("User properties updated successfully.");
      } else {
        const payload = {
          username,
          password,
          role: "USER",
          moduleIds: selectedModules,
        };
        await api.post("/users", payload);
        alert("User entry added successfully.");
      }

      closeFormModal();
      await loadUsers();
    } catch (error: unknown) {
      console.error(error);
      if (isAxiosError(error)) {
        alert(
          error.response?.data?.message || "Failed to update profile entry.",
        );
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const confirmMessage = `Are you sure you want to ${user.active ? "disable" : "enable"} ${user.username}'s account access`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await api.patch(`/users/${user.id}/status`, { active: !user.active });
      loadUsers();
    } catch (error) {
      console.error("Status modify breakdown:", error);
      alert("Failed to alter user lifecycle constraints.");
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setIsWelcomeModalOpen(true);
  };

  const closeFormModal = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setIsWelcomeModalOpen(false);
  };

  const handleModuleChange = (moduleId: number) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const sortedUsers = [...users].sort((a, b) => {
    return sortDirection === "asc" ? a.id - b.id : b.id - a.id;
  });

  const toggleSortOrder = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

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

      {/* --- TABLE DATA SECTION --- */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th
                  className="p-4 pl-6 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={toggleSortOrder}
                >
                  <span>Username / Identity</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {sortDirection === "asc" ? "▲ ID (Asc)" : "▼ ID (Desc)"}
                  </span>
                </th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {sortedUsers.map((user) => (
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
                          user.role === "SUPER_ADMIN" || user.role === "USER"
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
                        onClick={() => handleOpenEditModal(user)}
                        title="Edit User Info"
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
                      >
                        <Pencil size={16} strokeWidth={2.2} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        title={
                          user.active
                            ? "Deactivate Account"
                            : "Activate Account"
                        }
                        className={`p-2 rounded-xl transition-all ${
                          user.active
                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {user.active ? (
                          <UserX size={16} strokeWidth={2.2} />
                        ) : (
                          <CheckCircle size={16} strokeWidth={2.2} />
                        )}
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

      {/* FORM MANAGEMENT INPUT MODAL */}
      <Modal
        isOpen={isWelcomeModalOpen}
        onClose={closeFormModal}
        title={editingUser ? "Modify Workspace Profile" : "Create New User"}
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
              required
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 pr-10 bg-white border border-slate-200 rounded-lg text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                required={!editingUser}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
                <label
                  key={module.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
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
              onClick={closeFormModal}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-indigo-600/10 transition-colors"
            >
              {loading
                ? "Processing..."
                : editingUser
                  ? "Save Updates"
                  : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
