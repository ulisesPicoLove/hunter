(() => {
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

  const roundedRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  };

  const dl = (dataURL, filename) => {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = filename || "poster.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  function drawImageCover(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width,
      ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s,
      dh = ih * s;
    const dx = x + (w - dw) / 2,
      dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  const Poster = {
    cfg: {
      width: 1080,
      height: 1920,
      hashtag: "#CazaNubes",
      title: "HUMBE | CAZA NUBES",
      logoSrc: "assets/caza.webp",
      bgSrc: "assets/SkyBack.webp",
      gradFrom: "#0000ff",
      gradTo: "#ffd33d",
      panel: "#0b0b12",
      textMain: "#ffffff",
      textAccent: "#ffd33d",
    },
    _logo: null,
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
        this._logo = await loadImage(this.cfg.logoSrc);
      } catch {
        this._logo = null;
      }

      try {
        this._bg = await loadImage(this.cfg.bgSrc);
      } catch {
        this._bg = null;
      }
    },

    async make(data = {}) {
      const {
        gameCanvas,
        score = 0,
        best = 0,
        meters = 0,
        hashtag = this.cfg.hashtag,
      } = data;

      if (!this._ctx) await this.setup();

      const { width: W, height: H } = this._canvas;
      const ctx = this._ctx;

      // Fondo degradado
      if (this._bg) {
        drawImageCover(ctx, this._bg, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#000"; // fallback
        ctx.fillRect(0, 0, W, H);
      }

      // Panel central
      const panelPad = 48;
      const panelR = 38;
      ctx.save();
      ctx.shadowColor = "#0009";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = this.cfg.panel;
      roundedRect(
        ctx,
        panelPad,
        panelPad,
        W - panelPad * 2,
        H - panelPad * 2,
        panelR
      );
      ctx.fill();
      ctx.restore();

      if (gameCanvas && gameCanvas.width && gameCanvas.height) {
        const gw = gameCanvas.width;
        const gh = gameCanvas.height;

        const ph = Math.round(H * 0.38);
        const pw = Math.round(W - panelPad * 2 - 80);
        const px = Math.round((W - pw) / 2);
        const py = panelPad + 60;

        const ar = gw / gh;
        let dw = pw,
          dh = Math.round(pw / ar);
        if (dh > ph) {
          dh = ph;
          dw = Math.round(ph * ar);
        }
        const dx = Math.round(px + (pw - dw) / 2);
        const dy = Math.round(py + (ph - dh) / 2);

        ctx.save();
        ctx.shadowColor = "#0008";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#0e0e18";
        roundedRect(ctx, px, py, pw, ph, 28);
        ctx.fill();
        ctx.restore();

        ctx.save();
        roundedRect(ctx, dx, dy, dw, dh, 24);
        ctx.clip();
        ctx.drawImage(gameCanvas, 0, 0, gw, gh, dx, dy, dw, dh);
        ctx.restore();
      }

      if (this._logo) {
        const lw = Math.min(480, Math.round(W * 0.56));
        const ar = this._logo.width / this._logo.height || 2.5;
        const lh = Math.round(lw / ar);
        const lx = Math.round((W - lw) / 2);
        const ly = panelPad + 24;

        ctx.save();
        ctx.shadowColor = "#0007";
        ctx.shadowBlur = 16;
        roundedRect(ctx, lx - 12, ly - 12, lw + 24, lh + 24, 20);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fill();
        ctx.drawImage(this._logo, lx, ly, lw, lh);
        ctx.restore();
      }

      ctx.save();
      ctx.font = "900 46px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = this.cfg.textMain;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(this.cfg.title, W / 2, Math.round(H * 0.5));

      const big = 140;
      ctx.font = `900 ${big}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.textBaseline = "middle";
      ctx.strokeText(String(score), W / 2, Math.round(H * 0.63));
      ctx.fillStyle = this.cfg.textAccent;
      ctx.fillText(String(score), W / 2, Math.round(H * 0.63));

      ctx.font = "700 40px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "top";
      const line1 = `Récord: ${best}`;
      const line2 = `Distancia: ${Math.floor(meters)} m`;
      ctx.fillText(line1, W / 2, Math.round(H * 0.72));
      ctx.fillText(line2, W / 2, Math.round(H * 0.77));
      ctx.restore();

      ctx.save();
      ctx.font = "800 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(hashtag || this.cfg.hashtag, W / 2, H - panelPad - 12);
      ctx.restore();

      // Fecha
      ctx.save();
      ctx.font = "600 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const date = new Date();
      const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      ctx.fillText(stamp, W - panelPad - 8, H - panelPad - 8);
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

    async show({ score, best, meters, hashtag, logoSrc } = {}) {
      await this.setup({
        logoSrc: logoSrc || this.cfg.logoSrc,
        hashtag: hashtag || this.cfg.hashtag,
      });

      const btn = this.ensureButton();
      if (!btn) return;

      const gameCanvas = document.getElementById("game");

      btn.onclick = async (ev) => {
        ev.stopPropagation();
        btn.textContent = "Generando…";
        btn.style.opacity = "0.7";
        try {
          const dataURL = await this.make({
            gameCanvas,
            score,
            best,
            meters,
            hashtag,
          });
          dl(dataURL, `cazaNubes-${String(score).padStart(5, "0")}.png`);
        } catch (err) {
          console.error(err);
          alert("No se pudo generar el póster.");
        } finally {
          btn.textContent = "Descargar póster";
          btn.style.opacity = "1";
        }
      };
    },
  };

  window.Poster = Poster;
})();
