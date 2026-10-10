window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let points = [];
    const mouse = { x: null, y: null };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const config = { maxDistance: 145, mouseRadius: 150, speed: reducedMotion ? 0 : 0.22 };
    const random = (min, max) => Math.random() * (max - min) + min;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        const pointCount = Math.min(115, Math.max(55, Math.floor((width * height) / 17000)));
        points = Array.from({ length: pointCount }, () => ({
            x: random(0, width), y: random(0, height),
            vx: random(-config.speed, config.speed), vy: random(-config.speed, config.speed)
        }));
    }

    function update() {
        if (reducedMotion) return;
        points.forEach((point) => {
            point.x += point.vx;
            point.y += point.vy;
            if (point.x < 0 || point.x > width) point.vx *= -1;
            if (point.y < 0 || point.y > height) point.vy *= -1;
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.25, 0, Math.PI * 2);
            ctx.fill();
        });

        const gridSize = config.maxDistance;
        const grid = new Map();
        points.forEach((point, index) => {
            const key = `${Math.floor(point.x / gridSize)},${Math.floor(point.y / gridSize)}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(index);
        });

        points.forEach((point, index) => {
            const cellX = Math.floor(point.x / gridSize);
            const cellY = Math.floor(point.y / gridSize);
            for (let x = cellX - 1; x <= cellX + 1; x += 1) {
                for (let y = cellY - 1; y <= cellY + 1; y += 1) {
                    const nearby = grid.get(`${x},${y}`) || [];
                    nearby.forEach((otherIndex) => {
                        if (otherIndex <= index) return;
                        const other = points[otherIndex];
                        const distance = Math.hypot(point.x - other.x, point.y - other.y);
                        if (distance >= config.maxDistance) return;
                        const alpha = 1 - distance / config.maxDistance;
                        ctx.strokeStyle = `rgba(205, 220, 255, ${alpha * 0.34})`;
                        ctx.lineWidth = Math.max(0.35, alpha * 0.7);
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    });
                }
            }

            if (mouse.x === null) return;
            const distanceToMouse = Math.hypot(point.x - mouse.x, point.y - mouse.y);
            if (distanceToMouse >= config.mouseRadius) return;
            const alpha = 1 - distanceToMouse / config.mouseRadius;
            ctx.strokeStyle = `rgba(255, 190, 205, ${alpha * 0.55})`;
            ctx.lineWidth = Math.max(0.45, alpha);
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        });
    }

    function loop() {
        update();
        draw();
        if (!reducedMotion) animationFrame = window.requestAnimationFrame(loop);
    }

    resize();
    loop();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }, { passive: true });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    }, { passive: true });
    window.addEventListener('pagehide', () => {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
    }, { once: true });
});

