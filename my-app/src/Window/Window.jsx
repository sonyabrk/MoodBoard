import Card from '../Card/Card';
import './Window.scss';

function Window(props) {
    const { title, text, cards } = props;
    return (
        <div className = "windowFrame">
            <p className = "wTitle"> {title} </p>
            <p className = "wText"> {text} </p>
            <div className = "cardsContainer">
                {cards.map(card => (
                    <Card key = {card.id} item = {card} />
                ))}
            </div>
        </div>
    );
}

export default Window;