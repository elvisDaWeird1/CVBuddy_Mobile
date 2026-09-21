import { apiRequest } from "@/src/api/api-client";
import type { Pagination, PortfolioMoment } from "@/src/types/api";
import type { CapturedPhoto } from "@/src/camera/captured-photo-context";
import { Platform } from "react-native";

type CreateMomentData = {
  moment: PortfolioMoment;
};

type MomentListResponse = {
  items: PortfolioMoment[];
  pagination?: Pagination;
};

const appendPhotoToFormData = async (formData: FormData, photo: CapturedPhoto) => {
  if (Platform.OS !== "web") {
    formData.append("media", {
      uri: photo.uri,
      name: photo.name,
      type: photo.type
    } as unknown as Blob);
    return;
  }

  const response = await fetch(photo.uri);
  if (!response.ok) {
    throw new Error("Could not read the selected photo for upload.");
  }

  const blob = await response.blob();
  formData.append("media", blob, photo.name);
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
  await appendPhotoToFormData(formData, photo);
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

export const listMoments = async (token: string, signal?: AbortSignal) => {
  const response = await apiRequest<PortfolioMoment[]>("/portfolio/moments?page=1&limit=20", { signal, token });

  return {
    items: response.data || [],
    pagination: response.pagination
  } satisfies MomentListResponse;
};
