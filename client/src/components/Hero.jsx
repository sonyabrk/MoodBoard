import LoginButton from './LoginButthon';
import SearchButton from './SearchButton';
import './Hero.scss';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-buttons-row">
        <SearchButton />
        <LoginButton />
      </div>
      <div className="hero-content">
        <h1 className="hero-title">плэйн</h1>
      </div>
    </section>
  );
}

export default Hero;