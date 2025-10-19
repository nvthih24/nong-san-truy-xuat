import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import Login from './Login';
import Register from './Register';

interface AboutProps {
  user?: any | null;
  setUser?: (u: any | null) => void;
  onLoginSuccess?: (data: { token: string; user: any }) => void;
}

const About: React.FC<AboutProps> = ({ setUser, onLoginSuccess }) => {
  const [activeModal, setActiveModal] = useState<'none' | 'login' | 'register'>('none');
  const closeModal = () => setActiveModal('none');
  const switchToLogin = () => setActiveModal('login');
  const switchToRegister = () => setActiveModal('register');

  return (
    <div className="about-page">
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
      <main className="about-content">
        <section className="about-hero">
          <div className="about-hero-text">
            <h1>Về chúng tôi</h1>
            <p>
              <strong>ThirtySix</strong> là nền tảng truy xuất nguồn gốc nông sản Việt Nam,
              ứng dụng <span className="highlight">Blockchain</span> để mang lại
              sự minh bạch, tin cậy và bền vững trong chuỗi cung ứng nông nghiệp.
            </p>
          </div>
        </section>

        <section className="about-mission">
          <h2>Tầm nhìn & Sứ mệnh</h2>
          <div className="mission-grid">
            <div className="mission-card">
              <h3>🌾 Tầm nhìn</h3>
              <p>
                Trở thành hệ thống truy xuất nông sản hàng đầu giúp người tiêu dùng Việt
                dễ dàng tiếp cận thực phẩm sạch, rõ nguồn gốc.
              </p>
            </div>
            <div className="mission-card">
              <h3>🔗 Sứ mệnh</h3>
              <p>
                Xây dựng cầu nối giữa nông dân, doanh nghiệp và người tiêu dùng
                thông qua công nghệ hiện đại, minh bạch và tiện lợi.
              </p>
            </div>
          </div>
        </section>

        <section className="about-values">
          <div className="values-text">
            <h2>Giá trị cốt lõi</h2>
            <ul>
              <li>✅ <strong>Minh bạch</strong> – Mọi quy trình đều được ghi nhận và xác thực trên Blockchain.</li>
              <li>🌱 <strong>Bền vững</strong> – Khuyến khích sản xuất nông nghiệp thân thiện với môi trường.</li>
              <li>🤝 <strong>Niềm tin</strong> – Kết nối nông dân, doanh nghiệp và người tiêu dùng bằng dữ liệu thật.</li>
            </ul>
          </div>
          <div className="values-image">
            <img
              src="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=900&q=80"
              alt="Nông sản sạch Việt Nam"
              loading="lazy"
            />
          </div>
        </section>
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
    </div >
  );
};


export default About;