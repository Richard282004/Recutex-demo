import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartProvider } from '@/components/cart/CartProvider';
import { Footer, WhatsAppButton } from '@/components/Footer';
import { Header } from '@/components/header/Header';
import { Reveal } from '@/components/Reveal';
import { site } from '@/content/site';
import './globals.css';

// One family for the whole identity: Bricolage Grotesque's optical-size axis adapts it
// from display headlines to body text. Self-hosted by next/font (no request to Google).
const brand = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-brand',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Colchones, camas y muebles de fabricación propia`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: { siteName: site.name, locale: 'es_CL', type: 'website' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#f6f7f9',
};

// Arms the reveal animation before first paint; disarms it if JS never hydrates.
const revealScript = `(function(){var d=document.documentElement;if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('reveal-armed');setTimeout(function(){if(!d.hasAttribute('data-reveal-ready'))d.classList.remove('reveal-armed')},2500)}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={brand.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
      </head>
      <body>
        <a className="skip-link" href="#MainContent">
          Saltar al contenido
        </a>
        <CartProvider>
          <Header />
          <main id="MainContent" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
          <Reveal />
        </CartProvider>
      </body>
    </html>
  );
}
