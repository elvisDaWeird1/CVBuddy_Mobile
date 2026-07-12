import { apiRequest } from "@/src/api/api-client";
import type { Pagination, PortfolioMoment } from "@/src/types/api";
import type { CapturedPhoto } from "@/src/camera/captured-photo-context";

type CreateMomentData = {
  moment: PortfolioMoment;
};

type MomentListResponse = {
  items: PortfolioMoment[];
  pagination?: Pagination;
};

export const createMoment = async ({
  token,
  photo,
  caption
}: {
  token: string;
  photo: CapturedPhoto;
  caption: string;
}) => {
  const formData = new FormData();
  const file = {
    uri: photo.uri,
    name: photo.name,
    type: photo.type
  };

  formData.append("media", file as unknown as Blob);
  formData.append("capturedAt", photo.capturedAt);
  formData.append("visibility", "private");

  if (caption.trim()) {
    formData.append("caption", caption.trim());
  }

  const response = await apiRequest<CreateMomentData>("/portfolio/moments", {
    method: "POST",
    token,
    body: formData
  });

  if (!response.data) {
    throw new Error("Moment upload response did not include the created moment.");
  }

  return response.data.moment;
};

export const listMoments = async (token: string) => {
  const response = await apiRequest<PortfolioMoment[]>("/portfolio/moments?page=1&limit=20", { token });

  return {
    items: response.data || [],
    pagination: response.pagination
  } satisfies MomentListResponse;
};
