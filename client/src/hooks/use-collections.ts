import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCollection } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCollections() {
  return useQuery({
    queryKey: [api.collections.list.path],
    queryFn: async () => {
      const res = await fetch(api.collections.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch collections");
      return api.collections.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCollection) => {
      const res = await fetch(api.collections.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create collection");
      return api.collections.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.collections.list.path] });
      toast({ title: "Created", description: "Collection created successfully" });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.collections.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete collection");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.collections.list.path] });
      toast({ title: "Deleted", description: "Collection removed" });
    },
  });
}

export function useAddPaperToCollection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, paperId }: { collectionId: number; paperId: number }) => {
      const url = buildUrl(api.collections.addPaper.path, { id: collectionId, paperId });
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to add paper to collection");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate papers list to refresh any derived state if necessary
      queryClient.invalidateQueries({ queryKey: [api.papers.list.path] });
      toast({ title: "Added", description: "Paper added to collection" });
    },
  });
}
