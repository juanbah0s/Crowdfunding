import { api } from "./client";
import type { CategoryResponse, CreateCategoryRequest } from "./types";

export const categoriesApi = {
  list: async (): Promise<CategoryResponse[]> => {
    const res = await api.get<CategoryResponse[]>("/categories");
    return res.data;
  },

  create: async (data: CreateCategoryRequest): Promise<CategoryResponse> => {
    const res = await api.post<CategoryResponse>("/categories", data);
    return res.data;
  },
};
