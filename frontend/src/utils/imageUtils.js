const API_URL = "http://localhost:8080";

export const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  const normalizedImage = String(image).trim();

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("data:")
  ) {
    return normalizedImage;
  }

  if (normalizedImage.startsWith("//")) {
    return `https:${normalizedImage}`;
  }

  if (normalizedImage.startsWith("/uploads/")) {
    return `${API_URL}${normalizedImage}`;
  }

  return `${API_URL}/uploads/${normalizedImage}`;
};
