import { useState, useEffect } from 'react';
import { api } from '../../src/services/api';
import './CreatorFormModal.css';

function CreatorFormModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    portfolio_url: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState({
    checking: false,
    available: null,
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        portfolio_url: ''
      });
      setErrors({});
      setSubmitSuccess(false);
      setUsernameCheck({
        checking: false,
        available: null,
        message: ''
      });
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!formData.username.trim()) {
      setUsernameCheck({ available: null, message: '' });
      return;
    }

    if (formData.username.length < 3) {
      setUsernameCheck({
        available: false,
        message: 'минимум 3 символа'
      });
      return;
    }

    setUsernameCheck({ checking: true, available: null, message: '' });

    const timer = setTimeout(async () => {
      try {
        const result = await api.checkUsername(formData.username);
        setUsernameCheck({
          checking: false,
          available: result.available,
          message: result.message
        });
      } catch (error) {
        console.log(error);
        setUsernameCheck({
          checking: false,
          available: false,
          message: 'Ошибка проверки'
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'обязательное поле';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'обязательное поле';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'обязательное поле';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'неверный формат почты';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'обязательное поле';
    } else if (formData.username.length < 3) {
      newErrors.username = 'минимум 3 символа';
    } else if (usernameCheck.available === false) {
      newErrors.username = usernameCheck.message;
    }
    
    if (!formData.portfolio_url.trim()) {
      newErrors.portfolio_url = 'обязательное поле!';
    } else if (!/^https?:\/\//.test(formData.portfolio_url)) {
      newErrors.portfolio_url = 'должна начинаться с http:// или https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.createCreatorApplication(formData);
      setSubmitSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitSuccess) {
    return (
      <div className="creator-modal-overlay" onClick={onClose}>
        <div className="creator-modal-content creator-success-modal">
          <div className="creator-success-icon">✓</div>
          <h2 className="creator-success-title">Заявка отправлена!</h2>
          <p className="creator-success-text">
            спасибо за интерес к нашей платформе! мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-modal-overlay" onClick={onClose}>
      <div className="creator-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="creator-modal-close" onClick={onClose}>
          ✕
        </button>
        
        <h2 className="creator-modal-title">стать креатором</h2>
        
        <form onSubmit={handleSubmit} className="creator-form">
          <div className="form-group">
            <label htmlFor="first_name" className="form-label">
              имя *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`form-input ${errors.first_name ? 'error' : ''}`}
              placeholder="Введите ваше имя"
            />
            {errors.first_name && (
              <span className="error-text">{errors.first_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="last_name" className="form-label">
              фамилия *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={`form-input ${errors.last_name ? 'error' : ''}`}
              placeholder="Введите вашу фамилию"
            />
            {errors.last_name && (
              <span className="error-text">{errors.last_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              контактная почта *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="example@email.com"
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              желаемый юзернейм *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${
                errors.username ? 'error' : 
                usernameCheck.available === true ? 'success' : ''
              }`}
              placeholder="ваш_юзернейм"
            />
            
            {/* Индикатор проверки */}
            {usernameCheck.checking && (
              <span className="checking-text">проверка...</span>
            )}
            
            {/* Сообщение о доступности */}
            {usernameCheck.available === true && (
              <span className="success-text">✓ юзернейм доступен</span>
            )}
            
            {usernameCheck.available === false && usernameCheck.message && (
              <span className="error-text">{usernameCheck.message}</span>
            )}
            
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="portfolio_url" className="form-label">
              ссылка на портфолио / пинтерест *
            </label>
            <input
              type="url"
              id="portfolio_url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              className={`form-input ${errors.portfolio_url ? 'error' : ''}`}
              placeholder="https://pinterest.com/ваш_профиль"
            />
            <p className="form-hint">
              прикрепите ссылку на любую удобную платформу, чтобы показать нам свой стиль и вкус ;)
            </p>
            {errors.portfolio_url && (
              <span className="error-text">{errors.portfolio_url}</span>
            )}
          </div>

          {errors.submit && (
            <div className="form-error-submit">
              {errors.submit}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'отправка...' : 'отправить заявку'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatorFormModal;