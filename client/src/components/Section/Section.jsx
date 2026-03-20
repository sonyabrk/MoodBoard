import { useState, useEffect } from 'react';
import ProjectModal from '../ProjectModal/ProjectModal';
import CreatorFormModal from '../CreatorFormModal/CreatorFormModal';
import './Section.scss';

const Section = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.querySelector('.admin-section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="admin-section">
      <div className="admin-container">

        {/* Фотографии слева */}
        <div className="photos-container">
          <div className={`photo top-photo ${isVisible ? 'visible' : ''}`}>
            <img src="/images/home_photo1.jpeg" alt="Креативный процесс" />
          </div>

          <div className={`photo bottom-photo ${isVisible ? 'visible' : ''}`}>
            <img src="/images/home_photo2.jpeg" alt="Вдохновение" />
          </div>
        </div>

        {/* Кнопки справа */}
        <div className="admin-buttons">
          <button
            className="admin-btn admin-btn--project"
            onClick={() => setShowProjectModal(true)}
          >
            <span className="admin-btn__dot" />
            о проекте
          </button>

          <button
            className="admin-btn admin-btn--creator"
            onClick={() => setShowCreatorModal(true)}
          >
            <span className="admin-btn__dot" />
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

export default Section;