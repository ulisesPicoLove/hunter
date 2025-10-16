(() => {
  // ---- Helpers ----
  const loadImage = (src) =>
    new Promise((res, rej) => {
      if (!src) return res(null);
      const im = new Image();
      im.decoding = "async";
      im.loading = "eager";
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("No se pudo cargar: " + src));
      im.src = src;
    });

  function drawImageCover(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s,
      dh = ih * s;
    const dx = x + (w - dw) / 2,
      dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  const dl = (dataURL, filename) => {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = filename || "score.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const Poster = {
    cfg: {
      width: 1080,
      height: 1920,
      bgSrc: "assets/ShareScore.png",
      textColor: "#ffffff",
      strokeColor: "",
      shadowColor: "",
      family:
        "helvetica-neue-lt-pro-cond, sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    },
    _bg: null,
    _canvas: null,
    _ctx: null,
    _btn: null,

    async setup(options = {}) {
      Object.assign(this.cfg, options);
      if (!this._canvas) {
        this._canvas = document.createElement("canvas");
        this._canvas.width = this.cfg.width;
        this._canvas.height = this.cfg.height;
        this._ctx = this._canvas.getContext("2d");
      }
      try {
        this._bg = await loadImage(this.cfg.bgSrc);
      } catch {
        this._bg = null;
      }
    },

    async make({ score = 0, best = 0, meters = 0 } = {}) {
      if (!this._ctx) await this.setup();
      const { width: W, height: H } = this._canvas;
      const ctx = this._ctx;

      if (this._bg) drawImageCover(ctx, this._bg, 0, 0, W, H);
      else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      const fontScorePx = Math.round(H * 0.1); // Tamaño de la fuente
      const fontLabelPx = Math.round(H * 0.025);
      const fontLinesPx = Math.round(H * 0.035);
      const gapLabel = Math.round(H * 0.051); // separación número -> "Score:"
      const gapBetween = Math.round(H * 0.043); // separación entre líneas

      const yScore = Math.round(H * 0.36);
      const xCenter = Math.round(W / 2);

      ctx.font = `900 ${fontScorePx}px ${this.cfg.family}`;
      ctx.fillStyle = "#2d3b97";
      ctx.textBaseline = "middle";
      ctx.fillText(String(score), xCenter, yScore);

      ctx.font = `700 ${fontLabelPx}px ${this.cfg.family}`;
      ctx.fillStyle = "#ffffff";
      const yLabel = yScore + gapLabel;
      ctx.fillText("Puntuación", xCenter, yLabel);

      ctx.font = `700 ${fontLinesPx}px ${this.cfg.family}`;
      const yLine1 = yLabel + gapBetween;
      ctx.fillText(`Récord: ${best}`, xCenter, yLine1);

      const yLine2 = yLine1 + gapBetween;
      ctx.fillText(`Distancia: ${Math.floor(meters)} m`, xCenter, yLine2);

      ctx.restore();

      return this._canvas.toDataURL("image/png");
    },

    ensureButton() {
      const overlay = document.getElementById("overlay");
      if (!overlay) return null;
      const holder = overlay.querySelector("div");
      if (!holder) return null;

      let btn = overlay.querySelector("#downloadPosterBtn");
      if (!btn) {
        btn = document.createElement("div");
        btn.id = "downloadPosterBtn";
        btn.className = "btn";
        btn.textContent = "Descargar imagen";
        btn.style.marginLeft = "10px";
        const start = overlay.querySelector("#startBtn");
        if (start && start.parentElement === holder) {
          start.insertAdjacentElement("afterend", btn);
        } else {
          holder.appendChild(btn);
        }
      }
      this._btn = btn;
      return btn;
    },

    removeButton() {
      const btn = document.getElementById("downloadPosterBtn");
      if (btn && btn.parentElement) btn.parentElement.removeChild(btn);
      this._btn = null;
    },

    hide() {
      this.removeButton();
    },

    async show({ score, best, meters, bgSrc } = {}) {
      await this.setup({ bgSrc: bgSrc || this.cfg.bgSrc });
      const btn = this.ensureButton();
      if (!btn) return;

      btn.onclick = async (ev) => {
        ev.stopPropagation();
        btn.textContent = "Generando…";
        btn.style.opacity = "0.7";
        try {
          const dataURL = await this.make({ score, best, meters });
          const hash = Math.random().toString(36).substring(2, 10);
          dl(dataURL, `cazaNubes-${hash}.png`);
        } catch (err) {
          console.error(err);
          alert("No se pudo generar la imagen.");
        } finally {
          btn.textContent = "Descargar imagen";
          btn.style.opacity = "1";
        }
      };
    },
  };

  window.Poster = Poster;
})();
