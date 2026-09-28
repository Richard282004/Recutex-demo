'use client';

/*
  Gallery: native scroll-snap track (touch swipe), synced thumbnails, full-screen zoom in a
  <dialog>. `activeSrc` lets the variant picker jump to the variant's photo.
*/
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Image as ImageType } from '@/lib/types';
import { Icon } from '../Icon';

export function ProductGallery({
  images,
  title,
  activeSrc,
}: {
  images: ImageType[];
  title: string;
  activeSrc?: string | null;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomSrc, setZoomSrc] = useState<ImageType | null>(null);

  // Track which slide is visible.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = [...track.children];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setIndex(slides.indexOf(visible.target));
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((slide) => io.observe(slide));
    return () => io.disconnect();
  }, [images]);

  // Keep the active thumbnail in view (scroll the strip only, never the page).
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (strip && thumb) strip.scrollTo({ left: thumb.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 });
  }, [index]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    setIndex(i);
  };

  useEffect(() => {
    if (!activeSrc) return;
    const i = images.findIndex((img) => img.src === activeSrc);
    if (i >= 0) goTo(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to variant image changes
  }, [activeSrc]);

  const openZoom = (image: ImageType) => {
    setZoomSrc(image);
    dialogRef.current?.showModal();
  };

  return (
    <div className="product-gallery">
      <div className="product-gallery__viewport">
        <ul className="product-gallery__track" ref={trackRef} role="list" aria-label="Galería de imágenes">
          {images.map((image, i) => (
            <li className="product-gallery__slide" key={image.src} aria-current={i === index || undefined}>
              <button
                className="product-gallery__zoom"
                type="button"
                onClick={() => openZoom(image)}
                aria-label={`Ampliar imagen ${i + 1}`}
              >
                <Image
                  src={image.src}
                  alt={i === 0 ? title : `${title}, imagen ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 990px) 58vw, 100vw"
                />
              </button>
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <p className="product-gallery__counter" aria-hidden="true">
            {index + 1} / {images.length}
          </p>
        )}
      </div>

      {images.length > 1 && (
        <ul className="product-gallery__thumbs" ref={thumbsRef} role="list">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                className="product-gallery__thumb"
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === index}
              >
                <Image src={image.src} alt="" width={144} height={144} sizes="72px" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        className="zoom-dialog"
        ref={dialogRef}
        aria-label="Imagen ampliada"
        onClick={(event) => event.target === dialogRef.current && dialogRef.current?.close()}
        onClose={() => setZoomSrc(null)}
      >
        <button
          className="icon-button zoom-dialog__close"
          type="button"
          onClick={() => dialogRef.current?.close()}
        >
          <Icon name="close" />
          <span className="visually-hidden">Cerrar</span>
        </button>
        {zoomSrc && (
          <Image
            className="zoom-dialog__image"
            src={zoomSrc.src}
            alt={title}
            width={zoomSrc.width}
            height={zoomSrc.height}
            sizes="160vw"
            onClick={() => dialogRef.current?.close()}
          />
        )}
      </dialog>
    </div>
  );
}
