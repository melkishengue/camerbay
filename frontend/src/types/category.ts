export interface Category {
  id: string;
  name: string;
  title: string;
}

export interface CategoryListResponse {
  categories: Category[];
}
