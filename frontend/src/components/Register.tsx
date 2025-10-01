import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
  });
  const navigate = useNavigate();

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      navigate(`/${formData.role}`);
    } catch (err: any) {
      console.error(err.response?.data);
      alert(err.response?.data?.msg || 'Lỗi khi đăng ký!');
    }
  };

  return (
    <div>
      <h2>Đăng Ký</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Họ tên"
          value={formData.fullName}
          onChange={onChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="SĐT"
          value={formData.phone}
          onChange={onChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={onChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Địa chỉ"
          value={formData.address}
          onChange={onChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={onChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Xác nhận mật khẩu"
          value={formData.confirmPassword}
          onChange={onChange}
          required
        />
        <select name="role" value={formData.role} onChange={onChange}>
          <option value="farmer">Nông dân</option>
          <option value="transporter">Vận chuyển</option>
          <option value="manager">Quản lý</option>
        </select>
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
};

export default Register;