import { useNavigate } from 'react-router-dom'
import './SearchButton.scss'

function SearchButton() {
  const navigate = useNavigate()
  return (
    <button className="search-button" onClick={() => navigate('/search')} title="Поиск мудбордов">
      <svg className="search-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </button>
  )
}

export default SearchButton