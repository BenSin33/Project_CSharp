import api, { unwrap } from "./api";

/**
 * Uploads a file to the server and returns the URL.
 */
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const resp = await api.post("/api/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap<string>(resp) ?? "";
}

export const mediaService = {
  uploadFile,
};
