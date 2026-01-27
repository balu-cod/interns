import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// ✅ Backend base URL (from Render env var)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL!;

type Material = z.infer<typeof api.materials.get.responses[200]>;
type CreateMaterialInput = z.infer<typeof api.materials.create.input>;
type UpdateMaterialInput = z.infer<typeof api.materials.update.input>;

// ✅ Helper: always call backend correctly
function withBaseUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function useMaterials(search?: string) {
  const queryKey = search
    ? [api.materials.list.path, search]
    : [api.materials.list.path];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = search
        ? withBaseUrl(`${api.materials.list.path}?search=${encodeURIComponent(search)}`)
        : withBaseUrl(api.materials.list.path);

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch materials");
      return api.materials.list.responses[200].parse(await res.json());
    },
  });
}

export function useMaterial(code: string) {
  return useQuery({
    queryKey: [api.materials.get.path, code],
    queryFn: async () => {
      const path = buildUrl(api.materials.get.path, { code });
      const res = await fetch(withBaseUrl(path), { credentials: "include" });

      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch material");

      return api.materials.get.responses[200].parse(await res.json());
    },
    enabled: !!code,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaterialInput) => {
      const payload = {
        ...data,
        quantity: Number(data.quantity),
      };

      const res = await fetch(withBaseUrl(api.materials.create.path), {
        method: api.materials.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create material");
      }

      return api.materials.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.materials.list.path] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateMaterialInput) => {
      const path = buildUrl(api.materials.update.path, { id });

      const res = await fetch(withBaseUrl(path), {
        method: api.materials.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update material");

      return api.materials.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.materials.list.path] });
    },
  });
}
