export default function Footer() {
    const year = new Date().getFullYear();
  
    // 👉 Cambia "Tu nombre aquí" por tu nombre real
    const authorName = 'Otman Raad';
  
    return (
      <footer className="footer">
        <div className="footer-left">
          <span className="footer-brand">Padel Booking</span>
          <span className="footer-year">© {year}</span>
        </div>
  
        <div className="footer-center">
          <span>Aplicación web de reservas de pistas de pádel.</span>
          <span>Proyecto Fin de Grado – Desarrollo de Aplicaciones Web.</span>
        </div>
  
        <div className="footer-right">
          <span className="footer-author-label">Desarrollado por</span>
          <span className="footer-author-name">{authorName}</span>
        </div>
      </footer>
    );
  }