export type Photo = {
  id: string;
  filename: string;
  width: number;
  height: number;
  source: "upload" | "google-photos" | "seed";
  createdAt: string;
};

export type Album = {
  id: string;
  slug: string;
  title: string;
  description: string;
  // public albums appear in the portfolio; client albums are PIN-locked
  kind: "public" | "client";
  pin?: string;
  coverPhotoId?: string;
  featured: boolean;
  photos: Photo[];
  createdAt: string;
};

export type Db = {
  albums: Album[];
};
