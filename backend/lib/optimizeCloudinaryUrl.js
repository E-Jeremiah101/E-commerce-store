export const optimizeCloudinaryUrl = (url, width = 600, quality = "auto") => {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_${quality},w_${width}/`);
};
