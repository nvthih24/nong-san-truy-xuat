import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css';
import Login from './Login';
import Register from './Register';

interface ContactProps {
  user?: any | null;
  setUser?: (u: any | null) => void;
  onLoginSuccess?: (data: { token: string; user: any }) => void;
}

const Contact: React.FC<ContactProps> = ({setUser, onLoginSuccess}) => {
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'register'>('none');
  const closeModal = () => setActiveModal('none');
  const switchToLogin = () => setActiveModal('login');
  const switchToRegister = () => setActiveModal('register');
  return (
    <div className='contact-page'>
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src="/raumania.ico" alt="ThirtySix Logo" />
            ThirtySix
          </Link>
        </div>
        <nav className="nav">
          <Link to="/about">Giới thiệu</Link>
          <Link to="/contact">Liên hệ</Link>
        </nav>
        <div className="auth-actions">
          <button className="btn-login" onClick={switchToLogin}>Đăng nhập</button>
          <button className="btn-register" onClick={switchToRegister}>Đăng ký</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="contact-content">
        <h1>Liên hệ với chúng tôi</h1>
        <p className="intro">
          Nếu bạn có bất kỳ thắc mắc hoặc góp ý nào về hệ thống truy xuất nguồn gốc nông sản,
          hãy liên hệ với chúng tôi qua các kênh sau hoặc gửi tin nhắn trực tiếp.
        </p>

        <div className="contact-container">
          {/* LEFT: Contact Info */}
          <div className="contact-info">
            <h2>Thông tin liên hệ</h2>
            <ul>
              <li><strong>Email:</strong> support@thirtysix.vn</li>
              <li><strong>Hotline:</strong> 0901 234 567</li>
              <li><strong>Địa chỉ:</strong> 268 Lý Thường Kiệt, P.14, Q.10, TP.HCM</li>
            </ul>
            <img
              src="https://cdn.pixabay.com/photo/2018/04/10/13/09/online-3307293_1280.jpg"
              alt="Liên hệ ThirtySix"
              className="contact-image"
              loading="lazy"
            />
          </div>

          {/* RIGHT: Contact Form */}
          <form className="contact-form">
            <h2>Gửi tin nhắn</h2>
            <input type="text" placeholder="Họ và tên" required />
            <input type="email" placeholder="Email của bạn" required />
            <textarea rows={5} placeholder="Nội dung tin nhắn..." required></textarea>
            <button type="submit">Gửi ngay</button>
          </form>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 ThirtySix — Hệ thống truy xuất nguồn gốc nông sản Việt Nam</p>
      </footer>

      {activeModal !== 'none' && (
        // Lớp nền mờ
        <div className="modal-overlay" onClick={closeModal}>
          {activeModal === 'login' && (
            <Login
              onClose={closeModal}
              switchToRegister={switchToRegister}
              setUser={setUser}
              onLoginSuccess={(data) => {
                onLoginSuccess?.(data);
                closeModal();
              }}
            />
          )}
          {activeModal === 'register' && (
            <Register
              onClose={closeModal}
              switchToLogin={switchToLogin} // Truyền hàm chuyển đổi
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Contact;