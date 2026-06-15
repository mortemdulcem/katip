import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertNote } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useNotes(paperId: number) {
  return useQuery({
    queryKey: [api.notes.list.path, paperId],
    queryFn: async () => {
      const url = buildUrl(api.notes.list.path, { paperId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return api.notes.list.responses[200].parse(await res.json());
    },
    enabled: !!paperId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ paperId, ...data }: InsertNote & { paperId: number }) => {
      const url = buildUrl(api.notes.create.path, { paperId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create note");
      return api.notes.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { paperId }) => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path, paperId] });
      toast({ title: "Saved", description: "Note added successfully" });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, paperId }: { id: number; paperId: number }) => {
      const url = buildUrl(api.notes.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: (_, { paperId }) => {
      queryClient.invalidateQueries({ queryKey: [api.notes.list.path, paperId] });
      toast({ title: "Deleted", description: "Note removed" });
    },
  });
}
