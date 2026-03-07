import { useState, useEffect } from 'react';
import ProjectModal from './ProjectModal';
import CreatorFormModal from './CreatorFormModal';
import './AdminAvatars.css';

const AdminAvatars = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.querySelector('.admin-avatars-section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.90) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const admins = [
    { id: 1, name: 'sonyabrk', avatar: '/images/avatar1.jpeg' },
    { id: 2, name: 'agatashh', avatar: '/images/avatar2.jpeg' },
    { id: 3, name: 'lilyrose', avatar: '/images/avatar3.jpg' },
    { id: 4, name: 'yunglean', avatar: '/images/avatar4.jpg' },
  ];

  return (
    <section className="admin-avatars-section">
      <div className="admin-avatars-container">
        
        {/* Текст слева */}
        <div className="admin-text-column">
          <p className="admin-text">
            эти ребята сделали самые крутые доски на нашей платформе за последний месяц — 
            по нашему мнению, конечно ;)
          </p>
        </div>

        {/* Аватары по центру */}
        <div className="avatars-grid">
          {/* Верхний ряд - 2 аватара */}
          <div className="avatars-row">
            {admins.slice(0, 2).map((admin, index) => (
              <div
                key={admin.id}
                className={`admin-avatar-card from-left ${isVisible ? 'visible' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="avatar-wrapper">
                  <img
                    src={admin.avatar}
                    alt={admin.name}
                    className="admin-avatar"
                  />
                </div>
                <div className="admin-info">
                  <h3 className="admin-name">{admin.name}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Нижний ряд - 2 аватара */}
          <div className="avatars-row">
            {admins.slice(2, 4).map((admin, index) => (
              <div
                key={admin.id}
                className={`admin-avatar-card from-right ${isVisible ? 'visible' : ''}`}
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <div className="avatar-wrapper">
                  <img
                    src={admin.avatar}
                    alt={admin.name}
                    className="admin-avatar"
                  />
                </div>
                <div className="admin-info">
                  <h3 className="admin-name">{admin.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки справа */}
        <div className="admin-buttons">
          <button 
            className="admin-btn admin-btn--project"
            onClick={() => setShowProjectModal(true)}
          >
            о проекте
          </button>
          
          <button 
            className="admin-btn admin-btn--creator"
            onClick={() => setShowCreatorModal(true)}
          >
            стать одним из креаторов
          </button>
        </div>
      </div>

      {/* Модальные окна */}
      <ProjectModal 
        isOpen={showProjectModal} 
        onClose={() => setShowProjectModal(false)} 
      />
      
      <CreatorFormModal 
        isOpen={showCreatorModal} 
        onClose={() => setShowCreatorModal(false)} 
      />
    </section>
  );
};

export default AdminAvatars;