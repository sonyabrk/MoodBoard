import { useEffect } from 'react';
import './ProjectModal.scss';

function ProjectModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="project-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="project-modal-close" onClick={onClose}>
          ✕
        </button>
        
        <h2 className="project-modal-title">О проекте</h2>
        
        <div className="project-modal-text">
          <p>
            <strong>плэйн</strong> — это платформа для визуального вдохновения и творчества. 
            мы создаём пространство, где каждый может найти то, что вдохновит его на создание чего-то уникального.
          </p>
          
          <p>
            наша миссия — помогать людям находить красоту в повседневных вещах и превращать вдохновение в реальность.
          </p>
          
          <p>
            мы верим, что каждый человек — это творец. неважно, дизайнер ты, фотограф, художник или просто любишь красивые вещи — здесь найдётся место твоим идеям.
          </p>
          
          <p>
            <strong>что мы предлагаем:</strong>
          </p>
          <ul>
            <li>уникальные мудборды от лучших креаторов</li>
            <li>возможность стать частью нашего сообщества</li>
            <li>пространство для самовыражения и поиска себя и идей</li>
          </ul>
          
          <p>
            присоединяйся к нам и создавай вместе с нами!
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProjectModal;