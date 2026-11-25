import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state">
      <p className="state-title">Không tìm thấy trang</p>
      <p><Link to="/">Về trang chủ</Link></p>
    </div>
  );
}
