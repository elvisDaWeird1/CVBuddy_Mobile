export type ApiErrorItem = {
  field?: string;
  message: string;
};

export type ApiResponse<T> = {
  success: true;
  message: string;
  data?: T;
  pagination?: Pagination;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Account = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export type ApplicantProfile = {
  id: string;
  fullName: string;
};

export type AuthData = {
  token: string;
  account: Account;
};

export type CurrentAccountData = {
  account: Account;
  profile: ApplicantProfile | null;
};

export type PortfolioAsset = {
  id: string;
  assetType: string;
  usage: string;
  secureUrl: string;
  originalFilename: string;
  mimeType: string;
  format: string | null;
  bytes: number | null;
  createdAt: string;
};

export type PortfolioMoment = {
  id: string;
  experienceId: string | null;
  caption: string;
  capturedAt: string;
  location: string;
  skills: string[];
  mediaAssetIds: string[];
  mediaAssets: PortfolioAsset[];
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  experience?: { title: string } | null;
};
