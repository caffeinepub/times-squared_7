import { useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";

interface ImageCarouselProps {
  blobIds: string[];
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

function BlobImg({
  blobId,
  className,
  style,
}: { blobId: string; className?: string; style?: React.CSSProperties }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const blob = ExternalBlob.fromURL(blobId);
      setUrl(blob.getDirectURL());
    } catch {
      // ignore bad blob ids
    }
  }, [blobId]);

  if (!url)
    return (
      <div className={className} style={{ ...style, background: "#111" }} />
    );
  return (
    <img src={url} alt="" className={className} style={style} loading="lazy" />
  );
}

export default function ImageCarousel({
  blobIds,
  className,
  style,
  onClick,
}: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  if (blobIds.length === 0) return null;

  if (blobIds.length === 1) {
    return <BlobImg blobId={blobIds[0]} className={className} style={style} />;
  }

  const goTo = (i: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex(i);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) {
      e.stopPropagation();
      if (dx < 0) setIndex((prev) => (prev + 1) % blobIds.length);
      else setIndex((prev) => (prev - 1 + blobIds.length) % blobIds.length);
    }
    startX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = false;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) {
      e.stopPropagation();
      isDragging.current = true;
      if (dx < 0) setIndex((prev) => (prev + 1) % blobIds.length);
      else setIndex((prev) => (prev - 1 + blobIds.length) % blobIds.length);
    }
    startX.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.stopPropagation();
      isDragging.current = false;
      return;
    }
    onClick?.(e);
  };

  // Keyboard navigation: arrow keys advance slides
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setIndex((prev) => (prev + 1) % blobIds.length);
    } else if (e.key === "ArrowLeft") {
      setIndex((prev) => (prev - 1 + blobIds.length) % blobIds.length);
    } else if (e.key === "Enter" || e.key === " ") {
      onClick?.(e as unknown as React.MouseEvent);
    }
  };

  return (
    <section
      aria-label="Image carousel"
      className="relative overflow-hidden select-none"
      style={style}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {blobIds.map((id) => (
          <BlobImg
            key={id}
            blobId={id}
            className={`flex-shrink-0 w-full object-cover ${className ?? ""}`}
            style={{ height: style?.height ?? "100%" }}
          />
        ))}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {blobIds.map((id, i) => (
          <button
            key={id}
            type="button"
            data-ocid="carousel.dot"
            aria-label={`Image ${i + 1}`}
            onClick={(e) => goTo(i, e)}
            className="w-1.5 h-1.5 rounded-full transition-all duration-200"
            style={{
              background:
                i === index
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.3)",
              transform: i === index ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
