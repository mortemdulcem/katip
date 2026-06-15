import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPaper } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePapers(filters?: { search?: string; collectionId?: number; isFavorite?: boolean }) {
  // Construct query key that changes when filters change
  const queryKey = [api.papers.list.path, filters];
  
  // Construct URL with query params
  const urlParams = new URLSearchParams();
  if (filters?.search) urlParams.append("search", filters.search);
  if (filters?.collectionId) urlParams.append("collectionId", filters.collectionId.toString());
  if (filters?.isFavorite !== undefined) urlParams.append("isFavorite", filters.isFavorite.toString());
  
  const url = `${api.papers.list.path}?${urlParams.toString()}`;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch papers");
      return api.papers.list.responses[200].parse(await res.json());
    },
  });
}

export function usePaper(id: number) {
  return useQuery({
    queryKey: [api.papers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.papers.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch paper");
      return api.papers.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePaper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPaper) => {
      const res = await fetch(api.papers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create paper");
      }
      return api.papers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.papers.list.path] });
      toast({ title: "Success", description: "Paper added to your library" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePaper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertPaper>) => {
      const url = buildUrl(api.papers.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update paper");
      return api.papers.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.papers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.papers.get.path, id] });
      toast({ title: "Updated", description: "Paper updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.papers.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete paper");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.papers.list.path] });
      toast({ title: "Deleted", description: "Paper removed from library" });
    },
  });
}

export function useAnalyzePaper() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.papers.analyze.path, { id });
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Analysis failed");
      return api.papers.analyze.responses[200].parse(await res.json());
    },
  });
}
