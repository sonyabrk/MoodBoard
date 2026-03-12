import Hero from '../components/Hero';
import About from '../components/About';
import Section from '../components/Section';
import LoginButton from '../components/LoginButthon';

function Home() {
  return (
    <>
      <LoginButton />
      <Hero />
      <About />
      <Section />
    </>
  );
}

export default Home;