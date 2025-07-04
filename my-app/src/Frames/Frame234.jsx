import { useNavigate } from 'react-router-dom';
import './Frame234.scss';

function Frame234(props) {
    const { id, title, text, imgs } = props;
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`/window/${id}`);
    };

    return (
        <div className = "Frame234">
            <button className = 'title2'onClick = {handleClick}> { title } </button>
            <p className = 'textFrame234' > { text } </p>
            <p className = "click">  click on the title;) </p>
            <div>
                { imgs.map(({src, className}, index) => (
                    <img 
                        key = { index } 
                        src = {src} 
                        className = {className} 
                        alt = {`${title} ${index + 1}`} 
                    />
                ))}
            </div>
        </div>
    );
}

export default Frame234;