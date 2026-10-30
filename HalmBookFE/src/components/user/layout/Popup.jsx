import React , {useState , useEffect} from "react";

function Popup ({message , type ='error', duration = 3000, onClose}) {
    const [isVisible , setIsVisible] = useState(false); 

    useEffect(() => {
        if (!message) {
            setIsVisible(false);
            return;
        }
        
        setIsVisible(true);
        
        const timer = setTimeout(()=>{
            setIsVisible(false);
            
            if (onClose) {
                onClose();
            }
        },duration);
        
        return () => clearTimeout(timer);
        
    },[message , type , duration, onClose]); 

    if (!isVisible) return null;
    
    const style = {
        position: 'fixed', 
        top: '20px',       
        left: '50%',       
        transform: 'translateX(-50%)', 
        padding: '12px 24px', 
        borderRadius: '8px',  
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
        color: 'white',
        fontWeight: '600',    
        zIndex: 1000,         
        backgroundColor: type === 'success' ? '#28a745' : '#dc3545', 
        transition: 'opacity 0.3s ease-in-out', 
        opacity: 1, 
    };

    return (
        <div style={style}> 
            {message}
        </div>
        );
}
export default Popup;