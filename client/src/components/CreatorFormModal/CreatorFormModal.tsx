import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import './CreatorFormModal.scss'

interface CreatorFormModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  username: string
  portfolio_url: string
}

interface FormErrors {
  first_name?: string
  last_name?: string
  email?: string
  username?: string
  portfolio_url?: string
  submit?: string
}

interface UsernameCheck {
  checking: boolean
  available: boolean | null
  message: string
}

function CreatorFormModal({ isOpen, onClose }: CreatorFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    first_name: '', last_name: '', email: '', username: '', portfolio_url: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>({
    checking: false, available: null, message: ''
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setFormData({ first_name: '', last_name: '', email: '', username: '', portfolio_url: '' })
      setErrors({})
      setSubmitSuccess(false)
      setUsernameCheck({ checking: false, available: null, message: '' })
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  useEffect(() => {
    if (!formData.username.trim()) {
      setUsernameCheck({ checking: false, available: null, message: '' })
      return
    }
    if (formData.username.length < 3) {
      setUsernameCheck({ checking: false, available: false, message: 'минимум 3 символа' })
      return
    }
    setUsernameCheck({ checking: true, available: null, message: '' })
    const timer = setTimeout(async () => {
      try {
        const result = await api.checkUsername(formData.username)
        setUsernameCheck({ checking: false, available: result.available, message: result.message })
      } catch (error) {
        console.error(error)
        setUsernameCheck({ checking: false, available: false, message: 'Ошибка проверки' })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.username])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'обязательное поле'
    if (!formData.last_name.trim()) newErrors.last_name = 'обязательное поле'
    if (!formData.email.trim()) newErrors.email = 'обязательное поле'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'неверный формат почты'
    if (!formData.username.trim()) newErrors.username = 'обязательное поле'
    else if (formData.username.length < 3) newErrors.username = 'минимум 3 символа'
    else if (usernameCheck.available === false) newErrors.username = usernameCheck.message
    if (!formData.portfolio_url.trim()) newErrors.portfolio_url = 'обязательное поле!'
    else if (!/^https?:\/\//.test(formData.portfolio_url)) newErrors.portfolio_url = 'должна начинаться с http:// или https://'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      await api.createCreatorApplication(formData)
      setSubmitSuccess(true)
      setTimeout(() => onClose(), 3000)
    } catch (error) {
      setErrors({ submit: (error as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (submitSuccess) {
    return (
      <div className="creator-modal-overlay" onClick={onClose}>
        <div className="creator-modal-content creator-success-modal">
          <div className="creator-success-icon">✓</div>
          <h2 className="creator-success-title">Заявка отправлена!</h2>
          <p className="creator-success-text">спасибо за интерес к нашей платформе! мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="creator-modal-overlay" onClick={onClose}>
      <div className="creator-modal-content" onClick={e => e.stopPropagation()}>
        <button className="creator-modal-close" onClick={onClose}>✕</button>
        <h2 className="creator-modal-title">стать креатором</h2>
        <form onSubmit={handleSubmit} className="creator-form">
          {(['first_name', 'last_name'] as const).map(field => (
            <div className="form-group" key={field}>
              <label htmlFor={field} className="form-label">{field === 'first_name' ? 'имя' : 'фамилия'} *</label>
              <input type="text" id={field} name={field}
                value={formData[field]} onChange={handleChange}
                className={`form-input ${errors[field] ? 'error' : ''}`}
                placeholder={field === 'first_name' ? 'Введите ваше имя' : 'Введите вашу фамилию'} />
              {errors[field] && <span className="error-text">{errors[field]}</span>}
            </div>
          ))}
          <div className="form-group">
            <label htmlFor="email" className="form-label">контактная почта *</label>
            <input type="email" id="email" name="email" value={formData.email}
              onChange={handleChange} className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="example@email.com" />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="username" className="form-label">желаемый юзернейм *</label>
            <input type="text" id="username" name="username" value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'error' : usernameCheck.available === true ? 'success' : ''}`}
              placeholder="ваш_юзернейм" />
            {usernameCheck.checking && <span className="checking-text">проверка...</span>}
            {usernameCheck.available === true && <span className="success-text">✓ юзернейм доступен</span>}
            {usernameCheck.available === false && usernameCheck.message && <span className="error-text">{usernameCheck.message}</span>}
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="portfolio_url" className="form-label">ссылка на портфолио / пинтерест *</label>
            <input type="url" id="portfolio_url" name="portfolio_url" value={formData.portfolio_url}
              onChange={handleChange} className={`form-input ${errors.portfolio_url ? 'error' : ''}`}
              placeholder="https://pinterest.com/ваш_профиль" />
            <p className="form-hint">прикрепите ссылку на любую удобную платформу, чтобы показать нам свой стиль и вкус ;)</p>
            {errors.portfolio_url && <span className="error-text">{errors.portfolio_url}</span>}
          </div>
          {errors.submit && <div className="form-error-submit">{errors.submit}</div>}
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'отправка...' : 'отправить заявку'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreatorFormModal