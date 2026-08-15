export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RouteContract {
  route: string;
  status: "implemented" | "skeleton" | "planned";
  description: string;
  requestExample?: Record<string, unknown>;
  responseShape?: Record<string, unknown>;
}
