import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mapsApi } from "../api/hooks";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchMaps = async () => {
    try {
      const data = await mapsApi.list();
      setMaps(data);
    } catch (e) {
      console.error("Failed to fetch maps", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaps(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await mapsApi.create(name, description);
      setName("");
      setDescription("");
      setShowCreate(false);
      await fetchMaps();
    } catch (e) {
      console.error("Failed to create map", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this map?")) return;
    try {
      await mapsApi.delete(id);
      await fetchMaps();
    } catch (e) {
      console.error("Failed to delete map", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Maptory</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.username}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">My Maps</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            + New Map
          </button>
        </div>

        {showCreate && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : maps.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No maps yet</p>
            <p className="text-sm mt-1">Create your first map to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maps.map((map) => (
              <div key={map.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
                <h3
                  className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(`/map/${map.id}`)}
                >
                  {map.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{map.description || "No description"}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/map/${map.id}`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => handleDelete(map.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
