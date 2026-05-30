import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mapsApi, layersApi, pointsApi } from "../api/hooks";
import { TransformationContainer } from "react-zoom-pan-pinch";

export default function MapPage() {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const id = Number(mapId);
  const [map, setMap] = useState<any>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [pointsByLayer, setPointsByLayer] = useState<Record<number, any[]>>({});
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [showLayerForm, setShowLayerForm] = useState(false);
  const [layerName, setLayerName] = useState("");
  const [showPointForm, setShowPointForm] = useState(false);
  const [pointPos, setPointPos] = useState({ x: 0, y: 0 });
  const [pointData, setPointData] = useState<Record<string, any>>({});
  const [showSvgUpload, setShowSvgUpload] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMap = async () => {
    const data = await mapsApi.get(id);
    setMap(data);
  };

  const fetchLayers = async () => {
    const data = await layersApi.list(id);
    setLayers(data);
    const pts: Record<number, any[]> = {};
    for (const layer of data) {
      const layerPoints = await pointsApi.list(id, layer.id);
      pts[layer.id] = layerPoints;
    }
    setPointsByLayer(pts);
  };

  useEffect(() => { fetchMap(); fetchLayers(); }, [id]);

  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await mapsApi.uploadSvg(id, file);
      await fetchMap();
      setShowSvgUpload(false);
    } catch (err) {
      console.error("SVG upload failed", err);
    }
  };

  const handleCreateLayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!layerName.trim()) return;
    try {
      await layersApi.create(id, layerName);
      setLayerName("");
      setShowLayerForm(false);
      await fetchLayers();
    } catch (err) {
      console.error("Layer create failed", err);
    }
  };

  const handleToggleLayer = async (layerId: number) => {
    try {
      await layersApi.toggleVisibility(id, layerId);
      await fetchLayers();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const handleDeleteLayer = async (layerId: number) => {
    if (!confirm("Delete this layer and all its points?")) return;
    try {
      await layersApi.delete(id, layerId);
      setSelectedLayer(null);
      await fetchLayers();
    } catch (err) {
      console.error("Delete layer failed", err);
    }
  };

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedLayer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointPos({ x, y });
    const layer = layers.find((l) => l.id === selectedLayer);
    const fields = layer?.fields || [];
    const initialData: Record<string, any> = {};
    for (const f of fields) {
      if (f.type === "checkbox") initialData[f.name] = false;
      else initialData[f.name] = "";
    }
    setPointData(initialData);
    setShowPointForm(true);
  }, [selectedLayer, layers]);

  const handleCreatePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayer) return;
    try {
      await pointsApi.create(id, selectedLayer, pointPos.x, pointPos.y, pointData);
      setShowPointForm(false);
      await fetchLayers();
    } catch (err) {
      console.error("Point create failed", err);
    }
  };

  const handleDeletePoint = async (layerId: number, pointId: number) => {
    if (!confirm("Delete this point?")) return;
    try {
      await pointsApi.delete(id, layerId, pointId);
      setSelectedPoint(null);
      await fetchLayers();
    } catch (err) {
      console.error("Delete point failed", err);
    }
  };

  const handleUploadPhoto = async (point: any) => {
    if (!photoFile) return;
    try {
      await pointsApi.uploadPhoto(id, selectedLayer!, point.id, photoFile);
      setPhotoFile(null);
      await fetchLayers();
      setSelectedPoint(point);
    } catch (err) {
      console.error("Photo upload failed", err);
    }
  };

  const handleDeletePhoto = async (point: any, filename: string) => {
    try {
      await pointsApi.deletePhoto(id, selectedLayer!, point.id, filename);
      await fetchLayers();
      setSelectedPoint(point);
    } catch (err) {
      console.error("Delete photo failed", err);
    }
  };

  const visibleLayers = layers.filter((l) => l.is_visible);
  const allVisiblePoints = visibleLayers.flatMap((l) =>
    (pointsByLayer[l.id] || []).map((p) => ({ ...p, layerId: l.id }))
  );

  const layerColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const getLayerColor = (layerId: number) => {
    const idx = layers.findIndex((l) => l.id === layerId) % layerColors.length;
    return layerColors[idx];
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-lg font-bold text-gray-800">{map?.name || "Loading..."}</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r overflow-y-auto p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Layers</h2>
            <button
              onClick={() => setShowLayerForm(true)}
              className="text-blue-600 text-sm hover:underline"
            >
              + Add
            </button>
          </div>

          {showLayerForm && (
            <form onSubmit={handleCreateLayer} className="mb-3 p-2 bg-gray-50 rounded">
              <input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                placeholder="Layer name"
                className="w-full px-2 py-1 text-sm border rounded mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  Create
                </button>
                <button type="button" onClick={() => setShowLayerForm(false)} className="text-xs text-gray-500">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {layers.map((layer) => (
            <div key={layer.id} className="mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layer.is_visible}
                  onChange={() => handleToggleLayer(layer.id)}
                />
                <button
                  onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
                  className={`text-sm flex-1 text-left ${selectedLayer === layer.id ? "font-semibold text-blue-600" : "text-gray-700"}`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: getLayerColor(layer.id) }}></span>
                  {layer.name}
                </button>
                <button onClick={() => handleDeleteLayer(layer.id)} className="text-red-400 hover:text-red-600 text-xs">
                  ✕
                </button>
              </div>
            </div>
          ))}

          {selectedLayer && (
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              Click on the map to add a point to "{layers.find((l) => l.id === selectedLayer)?.name}"
            </div>
          )}
        </div>

        <div className="flex-1 relative overflow-hidden">
          {!map?.svg_path ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <p className="text-lg mb-2">No map image loaded</p>
              <button
                onClick={() => setShowSvgUpload(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Upload SVG
              </button>
              {showSvgUpload && (
                <label className="mt-3 cursor-pointer text-sm text-blue-600 hover:underline">
                  Choose SVG file
                  <input type="file" accept=".svg" onChange={handleSvgUpload} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            <TransformationContainer>
              {({ controls }) => (
                <div className="relative w-full h-full">
                  <div
                    ref={containerRef}
                    onClick={handleMapClick}
                    className="relative w-full h-full cursor-crosshair"
                  >
                    <img
                      src={`/uploads/maps/${map.svg_path}`}
                      alt={map.name}
                      className="select-none pointer-events-none"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                    {allVisiblePoints.map((point) => (
                      <button
                        key={point.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoint(point);
                        }}
                        className="absolute w-5 h-5 rounded-full border-2 border-white shadow transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition"
                        style={{
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                          backgroundColor: getLayerColor(point.layerId),
                        }}
                      />
                    ))}
                  </div>

                  <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                    <button onClick={() => controls?.zoomIn?.()} className="bg-white p-2 rounded shadow hover:bg-gray-100 text-lg font-bold">+</button>
                    <button onClick={() => controls?.zoomOut?.()} className="bg-white p-2 rounded shadow hover:bg-gray-100 text-lg font-bold">−</button>
                    <button onClick={() => controls?.resetTransform?.()} className="bg-white p-2 rounded shadow hover:bg-gray-100 text-xs">Reset</button>
                  </div>
                </div>
              )}
            </TransformationContainer>
          )}
        </div>

        {selectedPoint && (
          <div className="w-80 bg-white border-l overflow-y-auto p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Point Details</h3>
              <button onClick={() => setSelectedPoint(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Position: {selectedPoint.x.toFixed(1)}%, {selectedPoint.y.toFixed(1)}%
            </div>

            {Object.entries(selectedPoint.data || {}).map(([key, value]) => (
              <div key={key} className="mb-2">
                <span className="text-xs font-medium text-gray-600">{key}:</span>
                <p className="text-sm text-gray-800">
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                </p>
              </div>
            ))}

            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Photos</h4>
              {selectedPoint.photos && selectedPoint.photos.length > 0 ? (
                <div className="space-y-2">
                  {selectedPoint.photos.map((photo: string) => (
                    <div key={photo} className="relative">
                      <img src={`/uploads/photos/${photo}`} alt="Point" className="w-full rounded" />
                      <button
                        onClick={() => handleDeletePhoto(selectedPoint, photo)}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No photos</p>
              )}
              <label className="mt-2 block text-xs text-blue-600 cursor-pointer hover:underline">
                + Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </label>
              {photoFile && (
                <button
                  onClick={() => handleUploadPhoto(selectedPoint)}
                  className="mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Upload {photoFile.name}
                </button>
              )}
            </div>

            <button
              onClick={() => handleDeletePoint(selectedPoint.layerId, selectedPoint.id)}
              className="mt-4 w-full text-xs text-red-500 hover:text-red-700"
            >
              Delete point
            </button>
          </div>
        )}
      </div>

      {showPointForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Point</h3>
            <form onSubmit={handleCreatePoint} className="space-y-3">
              {Object.entries(pointData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                  {typeof value === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={pointData[key]}
                      onChange={(e) => setPointData({ ...pointData, [key]: e.target.checked })}
                    />
                  ) : (
                    <input
                      type="text"
                      value={pointData[key]}
                      onChange={(e) => setPointData({ ...pointData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              {Object.keys(pointData).length === 0 && (
                <p className="text-sm text-gray-500">No custom fields for this layer</p>
              )}
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Add
                </button>
                <button type="button" onClick={() => setShowPointForm(false)} className="text-gray-500 px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}