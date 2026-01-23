import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Types derived directly from schema via API contract
type Material = z.infer<typeof api.materials.get.responses[200]>;
type CreateMaterialInput = z.infer<typeof api.materials.create.input>;
type UpdateMaterialInput = z.infer<typeof api.materials.update.input>;

export function useMaterials(search?: string) {
  const queryKey = search ? [api.materials.list.path, search] : [api.materials.list.path];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = search 
        ? `${api.materials.list.path}?search=${encodeURIComponent(search)}` 
        : api.materials.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch materials");
      return api.materials.list.responses[200].parse(await res.json());
    },
  });
}

export function useMaterial(code: string) {
  return useQuery({
    queryKey: [api.materials.get.path, code],
    queryFn: async () => {
      const url = buildUrl(api.materials.get.path, { code });
      const res = await fetch(url, { credentials: "include" });
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
      // Coerce numeric strings to numbers if necessary
      const payload = {
        ...data,
        quantity: Number(data.quantity)
      };
      
      const res = await fetch(api.materials.create.path, {
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
      const url = buildUrl(api.materials.update.path, { id });
      
      const res = await fetch(url, {
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
