import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  setUser: (user: { id: string; email: string; role: string } | null) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate(`/${res.data.user.role}`);
    } catch (err: any) {
      console.error(err.response?.data);
      alert(err.response?.data?.msg || 'Lỗi khi đăng nhập!');
    }
  };

  return (
    <div>
      <h2>Đăng Nhập</h2>
      <form onSubmit={onSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
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
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
};

export default Login;