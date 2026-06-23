const API_URL = "http://localhost:8080";

export const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  // Nếu đã là link online hoặc link localhost đầy đủ
  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  // Nếu ảnh đã có /uploads/
  if (image.startsWith("/uploads/")) {
    return `${API_URL}${image}`;
  }

  // Nếu chỉ là tên file
  return `${API_URL}/uploads/${image}`;
};