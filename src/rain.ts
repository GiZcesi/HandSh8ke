export function startMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    document.body.appendChild(canvas);
  
    const ctx = canvas.getContext('2d')!;
    const fontSize = 5;
    const letters = '█▓▒░▌▐▀▄■□';
  
    const drops: {
      y: number;
      speed: number;
      char: string;
    }[] = [];
  
    // === Get and process the --text color from CSS ===
    const rootStyles = getComputedStyle(document.documentElement);
    let textColor = rootStyles.getPropertyValue('--text').trim();
  
    // If it's HSL, convert to HSLA with alpha
    if (textColor.startsWith('hsl')) {
      textColor = textColor.replace(/\s+/g, ''); // remove whitespace
      textColor = textColor.replace('hsl', 'hsla').replace(')', ', 0.3)'); // 0.5 = 50% opacity
    }
  
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops.length = 0;
      const columns = Math.floor(canvas.width / fontSize);
      for (let i = 0; i < columns; i++) {
        drops.push({
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 1.5,
          char: letters[Math.floor(Math.random() * letters.length)],
        });
      }
    }
  
    function draw() {
      // === TRAIL opacity (affects fade length) ===
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // lower alpha = longer trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      ctx.font = `${fontSize}px Courier New`;
  
      // === CHARACTER opacity (inherited from --text) ===
      ctx.fillStyle = textColor;
  
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * fontSize;
        const y = drop.y * fontSize;
  
        ctx.fillText(drop.char, x, y);
  
        if (Math.random() < 0.02) {
          drop.char = letters[Math.floor(Math.random() * letters.length)];
        }
  
        drop.y += drop.speed;
  
        if (y > canvas.height && Math.random() > 0.975) {
          drop.y = 0;
        }
      }
  
      requestAnimationFrame(draw);
    }
  
    window.addEventListener('resize', resize);
    resize();
    draw();
  }
  