export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">Padex</span>

        <span className="footer-copy">
          © {year} · Proyecto DAW
        </span>

        <span className="footer-author">
          Otman Raad
        </span>
      </div>
    </footer>
  );
}