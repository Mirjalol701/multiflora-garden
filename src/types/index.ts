export type PlantListItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ServiceListItem = {
  id: string;
  title: string;
  description: string;
  price: number;
};
