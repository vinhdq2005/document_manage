import { documentsApi } from '../api';

// Download cần header Authorization nên không dùng được thẻ <a href> thông thường.
// Tên tệp lấy từ metadata vì trình duyệt không đọc được Content-Disposition qua CORS.
export async function downloadDocument(doc) {
  const blob = await documentsApi.download(doc.id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.original_filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
