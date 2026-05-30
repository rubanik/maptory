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
