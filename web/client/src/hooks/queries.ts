import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectsApi,
  lineItemsApi,
  bomApi,
  type AddLineItemFields,
  type UpdateLineItemFields,
} from '../api/client';
import type { CategoryName } from '../types';

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await projectsApi.list();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useProject(name: string | undefined) {
  return useQuery({
    queryKey: ['projects', name],
    queryFn: async () => {
      if (!name) throw new Error('Project name is required');
      const result = await projectsApi.get(name);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!name,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const result = await projectsApi.create(name, description);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await projectsApi.delete(name);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Line Items
export function useLineItems(projectName: string | undefined, category?: CategoryName) {
  return useQuery({
    queryKey: ['projects', projectName, 'items', category],
    queryFn: async () => {
      if (!projectName) throw new Error('Project name is required');
      const result = await lineItemsApi.list(projectName, category);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!projectName,
  });
}

export function useAddLineItem(projectName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: AddLineItemFields) => {
      const result = await lineItemsApi.add(projectName, fields);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectName] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectName, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectName, 'bom'] });
    },
  });
}

export function useUpdateLineItem(projectName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, fields }: { itemId: string; fields: UpdateLineItemFields }) => {
      const result = await lineItemsApi.update(projectName, itemId, fields);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectName] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectName, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectName, 'bom'] });
    },
  });
}

export function useDeleteLineItem(projectName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const result = await lineItemsApi.delete(projectName, itemId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectName] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectName, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectName, 'bom'] });
    },
  });
}

// Bill of Materials
export function useBom(projectName: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectName, 'bom'],
    queryFn: async () => {
      if (!projectName) throw new Error('Project name is required');
      const result = await bomApi.get(projectName);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!projectName,
  });
}
