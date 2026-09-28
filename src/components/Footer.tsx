import Link from 'next/link';
import { footerLinks, navigation, site } from '@/content/site';
import { BrandBands, Icon } from './Icon';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <BrandBands className="site-footer__bands" />
      <div className="page-width">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link className="site-footer__logo" href="/">
              {site.name}
            </Link>
            <p className="site-footer__tagline">{site.tagline}</p>
            <ul className="site-footer__contact" role="list">
              <li>
                <a href={`https://wa.me/${site.contact.whatsapp}`} target="_blank" rel="noopener">
                  <Icon name="chat" />
                  WhatsApp {site.contact.whatsappLabel}
                </a>
              </li>
              <li>
                <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </li>
            </ul>
          </div>
          <div className="site-footer__blocks">
            <div className="site-footer__block">
              <h2 className="site-footer__heading">Productos</h2>
              <ul className="site-footer__links" role="list">
                {navigation
                  .filter((item) => item.href.startsWith('/collections'))
                  .map((item) => (
                    <li key={item.title}>
                      <Link href={item.href}>{item.title}</Link>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="site-footer__block">
              <h2 className="site-footer__heading">Información</h2>
              <ul className="site-footer__links" role="list">
                {footerLinks.map((link) => (
                  <li key={link.title}>
                    <Link href={link.href}>{link.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="site-footer__block">
              <h2 className="site-footer__heading">Casa matriz</h2>
              <p className="site-footer__text">
                {site.contact.address}
                <br />
                {site.contact.hours}
              </p>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            <small>
              © {year} {site.legalName}
            </small>
          </p>
          <p className="site-footer__payments">
            <small>Pago seguro con Webpay</small>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppButton() {
  const text = encodeURIComponent('Hola, tengo una consulta sobre un producto.');
  return (
    <a
      className="whatsapp-button"
      href={`https://wa.me/${site.contact.whatsapp}?text=${text}`}
      target="_blank"
      rel="noopener"
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.7a10.7 10.7 0 0 1-5.5-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.7 10.7 0 1 1 16 26.7Zm5.9-8c-.3-.2-1.9-1-2.2-1-.3-.1-.5-.2-.7.1l-1 1.2c-.2.2-.4.3-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4a3.7 3.7 0 0 0-1.1 2.7c0 1.6 1.2 3.2 1.3 3.4.2.2 2.3 3.5 5.6 4.9 2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.8-.6Z" />
      </svg>
      <span className="visually-hidden">Escríbenos por WhatsApp</span>
    </a>
  );
}
