import CircularText from '../CircularText/CircularText'
import './About.scss'

function About() {
  return (
    <section className="about-section">
      <div className="about-container">
        <div className="about-right">
          <div className="about-text-column">
            <p className="about-text">место, где рождаются идеи</p>
            <p className="about-text">место, где для каждого найдется что-то свое</p>
            <p className="about-text">место, где каждый день — это новая история</p>
          </div>
        </div>
        <div className="about-left">
          <CircularText
            text="★★★★★★★★★"
            onHover="speedUp"
            spinDuration={30}
            className="custom-circular"
          />
        </div>
      </div>
    </section>
  )
}

export default About