import React, { useState } from 'react';
import './AuthForm.css';
import axios from 'axios';

interface LoginProps {
  onLoginSuccess?: (data: any) => void;
  onClose?: () => void;
  switchToRegister?: () => void;
  setUser?: (user: any | null) => void;
}

const Login: React.FC<LoginProps> = ({ setUser, onLoginSuccess, onClose, switchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '', remember: false });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      setUser?.(res.data?.user);
      onLoginSuccess?.(res.data);
    } catch (err: any) {
      console.error(err.response?.data);
      alert(err.response?.data?.msg || 'Lỗi khi đăng nhập!');
    }
  };

  return (
    <div className="register-container">
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button className="login-close" onClick={onClose} aria-label="Close">×</button>
        )}

        <div className="brand">
          <img src="/raumania.ico" alt="logo" />
          <h2>Đăng Nhập</h2>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <label className="input-wrap">
            <span className="sr-only">Email</span>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={onChange}
              required
              autoFocus
            />
          </label>

          <label className="input-wrap">
            <span className="sr-only">Mật khẩu</span>
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={onChange}
              required
            />
          </label>

          <div className="form-row">
            <label className="remember">
              <input type="checkbox" name="remember" checked={formData.remember} onChange={onChange} />
              Ghi nhớ
            </label>
            <button type="button" className="link-btn" onClick={() => alert('Chức năng quên mật khẩu')}>
              Quên mật khẩu?
            </button>
          </div>

          <button type="submit" className="primary-btn">Đăng nhập</button>

          <div className="divider"><span>Hoặc</span></div>

          <div className="socials">
            <button type="button" className="social-btn google">Đăng nhập với Google</button>
            <button type="button" className="social-btn phone">Đăng nhập bằng SĐT</button>
          </div>

        </form>
        {/* Footer */}
        <div className="auth-footer">
          <p>Chưa có tài khoản? <a onClick={() => switchToRegister?.()}>Đăng ký</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;