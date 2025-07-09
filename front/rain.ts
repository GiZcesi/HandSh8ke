export function startMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    document.body.appendChild(canvas);
  
    const ctx = canvas.getContext('2d')!;
    const fontSize = 4;
    const letters = '█▓▒░▌▐▀▄■□';
  
    interface Drop {
      y: number;
      speed: number;
      char: string;
      dx: number;
      dy: number;
    }
  
    const drops: Drop[] = [];
    const mouse = { x: -9999, y: -9999 };
  
    const rootStyles = getComputedStyle(document.documentElement);
    let textColor = rootStyles.getPropertyValue('--text').trim();
    if (textColor.startsWith('hsl')) {
      textColor = textColor.replace(/\s+/g, '').replace('hsl', 'hsla').replace(')', ',0.3)');
    }
  
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      
        const columns = Math.floor(canvas.width / fontSize);
      
        // Adjust the number of drops to match new column count
        if (drops.length < columns) {
          for (let i = drops.length; i < columns; i++) {
            drops.push({
              y: -Math.random() * canvas.height,
              speed: 0.5 + Math.random() * 1.5,
              char: randomChar(),
              dx: 0,
              dy: 0,
            });
          }
        } else if (drops.length > columns) {
          drops.length = columns;
        }
      }
  
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `bold ${fontSize}px Courier New`;
      ctx.fillStyle = textColor;
  
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * fontSize + drop.dx;
        const y = drop.y * fontSize + drop.dy;
  
        ctx.fillText(drop.char, x, y);
  
        // Decay wind + scatter effect (friction)
        drop.dx *= 0.9;
        drop.dy *= 0.9;
  
        // Apply scatter force if mouse is near
        const dist = Math.hypot(mouse.x - x, mouse.y - y);
        if (dist < 60) {
          const angle = Math.atan2(y - mouse.y, x - mouse.x); // direction away from mouse
          const force = (60 - dist) / 60; // inverse strength
          drop.dx += Math.cos(angle) * force * 0.5;
          drop.dy += Math.sin(angle) * force * 0.5;
        }
  
        // Occasionally change character
        if (Math.random() < 0.02) drop.char = randomChar();
  
        // Advance drop naturally
        drop.y += drop.speed;
  
        // Reset if out of bounds
        // Reset if out of bounds
        if (drop.y * fontSize > canvas.height) {
            drop.y = -Math.random() * 20; // restart above screen
            drop.dy = 0;
            drop.dx = 0;
        }
      }
      // Vignette effect
        const gradient = ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            Math.max(canvas.width, canvas.height) * 0.5
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    }
  
    const randomChar = () => letters[Math.floor(Math.random() * letters.length)];
  
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
  
    window.addEventListener('resize', resize);
    resize();
    draw();
  }
  