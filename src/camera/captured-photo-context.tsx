import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CapturedPhoto = {
  uri: string;
  name: string;
  type: string;
  capturedAt: string;
};

type CapturedPhotoContextValue = {
  photo: CapturedPhoto | null;
  setPhoto: (photo: CapturedPhoto) => void;
  clearPhoto: () => void;
};

const CapturedPhotoContext = createContext<CapturedPhotoContextValue | null>(null);

export function CapturedPhotoProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);

  const value = useMemo(
    () => ({ photo, setPhoto, clearPhoto: () => setPhoto(null) }),
    [photo]
  );

  return <CapturedPhotoContext.Provider value={value}>{children}</CapturedPhotoContext.Provider>;
}

export const useCapturedPhoto = () => {
  const context = useContext(CapturedPhotoContext);

  if (!context) {
    throw new Error("useCapturedPhoto must be used inside CapturedPhotoProvider");
  }

  return context;
};
