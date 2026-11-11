import api from "./api/client";

// Không dùng <a href> vì API cần header Authorization -> tải về dạng blob rồi tự kích hoạt tải
export async function downloadDocument(doc) {
  const res = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.original_filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
