import React, { useState } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // Không cần nếu không điều hướng
import './AuthForm.css'; // << THAY ĐỔI: Dùng file CSS chung


interface RegisterProps {
  onClose?: () => void;
  // Thêm prop để chuyển qua lại form login
  switchToLogin?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onClose, switchToLogin }) => {
  const [formData, setFormData] = useState({
    // ... state của bạn giữ nguyên
    fullName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
  });
  // const navigate = useNavigate(); // Không cần
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu và xác nhận mật khẩu không khớp!');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      switchToLogin?.(); // Tự động chuyển qua form login sau khi đăng ký thành công
    } catch (err: any) {
      console.error("Lỗi đăng ký:", err.response?.data || err.message);
      alert(err.response?.data?.msg || 'Lỗi khi đăng ký!');
    }
  };

  return (
    // THÊM LỚP BAO BỌC GIỐNG HỆT LOGIN.TSX
    <div className="login-container">
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button className="login-close" onClick={onClose}>×</button>

        {/* Header */}
        <div className="brand" style={{ marginBottom: '20px' }}>
          {/* Bạn có thể thêm logo ở đây nếu muốn */}
          <img src="/raumania.ico" alt="logo" />
          <h2>Tạo tài khoản</h2>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={onSubmit}>
          {/* Sửa lại cấu trúc các input để dùng chung class */}
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <input type="text" id="fullName" name="fullName" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input type="text" id="phone" name="phone" placeholder="09xxxxxxxx" value={formData.phone} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="email@example.com" value={formData.email} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="address">Địa chỉ</label>
            <input type="text" id="address" name="address" placeholder="123 Đường ABC..." value={formData.address} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input type="password" id="password" name="password" placeholder="••••••••" value={formData.password} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="role">Vai trò</label>
            <select id="role" name="role" value={formData.role} onChange={onChange}>
              <option value="farmer">Nông dân</option>
              <option value="transporter">Nhà vận chuyển</option>
              <option value="manager">Quản lý</option>
            </select>
          </div>

          {/* SỬA LẠI CLASS NÚT BẤM */}
          <button type="submit" className="primary-btn" style={{ marginTop: '10px' }}>Đăng ký</button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p>Đã có tài khoản? <a onClick={switchToLogin}>Đăng nhập</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;