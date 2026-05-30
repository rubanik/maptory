import client from "./client";
import type { User, TokenResponse } from "../types";

export const authApi = {
  register: async (username: string, email: string, password: string): Promise<User> => {
    const { data } = await client.post("/auth/register", { username, email, password });
    return data;
  },

  login: async (username: string, password: string): Promise<TokenResponse> => {
    const { data } = await client.post("/auth/login", { username, password });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await client.get("/auth/me");
    return data;
  },
};

export const mapsApi = {
  list: async (): Promise<any[]> => {
    const { data } = await client.get("/maps/");
    return data;
  },

  create: async (name: string, description: string = "") => {
    const { data } = await client.post("/maps/", { name, description });
    return data;
  },

  get: async (id: number) => {
    const { data } = await client.get(`/maps/${id}`);
    return data;
  },

  update: async (id: number, name: string, description: string) => {
    const { data } = await client.put(`/maps/${id}`, { name, description });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await client.delete(`/maps/${id}`);
    return data;
  },

  uploadSvg: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await client.post(`/maps/${id}/upload-svg`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

export const layersApi = {
  list: async (mapId: number) => {
    const { data } = await client.get(`/maps/${mapId}/layers/`);
    return data;
  },

  create: async (mapId: number, name: string, fields: any[] = []) => {
    const { data } = await client.post(`/maps/${mapId}/layers/`, { name, fields });
    return data;
  },

  update: async (mapId: number, layerId: number, name: string, fields: any[]) => {
    const { data } = await client.put(`/maps/${mapId}/layers/${layerId}`, { name, fields });
    return data;
  },

  toggleVisibility: async (mapId: number, layerId: number) => {
    const { data } = await client.patch(`/maps/${mapId}/layers/${layerId}/visibility`);
    return data;
  },

  delete: async (mapId: number, layerId: number) => {
    const { data } = await client.delete(`/maps/${mapId}/layers/${layerId}`);
    return data;
  },
};

export const pointsApi = {
  list: async (mapId: number, layerId: number) => {
    const { data } = await client.get(`/maps/${mapId}/layers/${layerId}/points/`);
    return data;
  },

  create: async (mapId: number, layerId: number, x: number, y: number, data: Record<string, any> = {}) => {
    const { data: result } = await client.post(`/maps/${mapId}/layers/${layerId}/points/`, { x, y, data });
    return result;
  },

  update: async (mapId: number, layerId: number, pointId: number, x: number, y: number, data: Record<string, any>) => {
    const { data: result } = await client.put(`/maps/${mapId}/layers/${layerId}/points/${pointId}`, { x, y, data });
    return result;
  },

  delete: async (mapId: number, layerId: number, pointId: number) => {
    const { data } = await client.delete(`/maps/${mapId}/layers/${layerId}/points/${pointId}`);
    return data;
  },

  uploadPhoto: async (mapId: number, layerId: number, pointId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await client.post(`/maps/${mapId}/layers/${layerId}/points/${pointId}/upload-photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deletePhoto: async (mapId: number, layerId: number, pointId: number, filename: string) => {
    const { data } = await client.delete(`/maps/${mapId}/layers/${layerId}/points/${pointId}/photo/${filename}`);
    return data;
  },
};