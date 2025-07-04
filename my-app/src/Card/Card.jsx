import { useState } from 'react';
import './Card.scss';

function Card( { item } ) {
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    return (
        <div className = {`card card-${item.id}`} >
            <img 
                src = {item.img}
                className = {item.className}
                alt = {`Card ${item.id}`}
            />

            {item.description && (
                <p className = "cardText"> {item.description} </p>
            )}

            <button className = "buttonText" onClick = { () => setIsModalOpen(true)}> {item.btnText} </button>
            
            {isModalOpen && (
                <>
                    <div className = "modOverlay" onClick = { () => setIsModalOpen(false)}/>
                    <div className = "modContent">
                        <p className = "advr">Your advertisement could be here!</p>
                        <button className = "modClose" onClick ={ () => setIsModalOpen(false)}>Close</button>
                    </div>
                </>
            )}

        </div>
    );
}

export default Card;