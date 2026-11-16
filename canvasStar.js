window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastFrame = 0;
    let points = [];
    let palette;
    const mouse = { x: null, y: null };
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const config = { maxDistance: 145, mouseRadius: 150, speed: 0.17, maxCount: 150, maxSpeed: 3 };
    const storageKey = 'bohese-startmenu-particles';
    const settings = { count: null, speed: 1, attraction: false };
    const random = (min, max) => Math.random() * (max - min) + min;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (Number.isInteger(saved?.count)) settings.count = clamp(saved.count, 0, config.maxCount);
        if (Number.isFinite(saved?.speed)) settings.speed = clamp(saved.speed, 0, config.maxSpeed);
        settings.attraction = saved?.attraction === true;
    } catch {
        // The defaults also work when storage is unavailable.
    }

    const picker = document.getElementById('particlePicker');
    const toggle = document.getElementById('particleToggle');
    const panel = document.getElementById('particlePanel');
    const countInput = document.getElementById('particleCount');
    const countValue = document.getElementById('particleCountValue');
    const speedInput = document.getElementById('particleSpeed');
    const speedValue = document.getElementById('particleSpeedValue');
    const speedHint = document.getElementById('particleSpeedHint');
    const attractionInput = document.getElementById('particleAttraction');

    function saveSettings() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch {
            // Changes still apply for this visit.
        }
    }

    function showPanel(open, returnFocus = false) {
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (returnFocus) toggle.focus();
    }

    function refreshControls() {
        countInput.value = points.length;
        countValue.value = points.length;
        speedInput.value = settings.speed;
        speedValue.value = settings.speed + '×';
        speedInput.setAttribute('aria-valuetext', settings.speed + ' 倍');
        speedHint.hidden = !motionPreference.matches;
        attractionInput.checked = settings.attraction;
    }

    toggle.addEventListener('click', () => showPanel(panel.hidden));
    function closeOnOutside(event) {
        if (!panel.hidden && !picker.contains(event.target)) showPanel(false);
    }
    document.addEventListener('click', closeOnOutside);
    document.addEventListener('focusin', closeOnOutside);
    document.addEventListener('keydown', (event) => {
        if (!panel.hidden && event.key === 'Escape') showPanel(false, true);
    });
    countInput.addEventListener('input', () => {
        settings.count = countInput.valueAsNumber;
        updateCount(settings.count);
        refreshControls();
        restartDrawing();
    });
    speedInput.addEventListener('input', () => {
        settings.speed = speedInput.valueAsNumber;
        refreshControls();
        restartDrawing();
    });
    countInput.addEventListener('change', saveSettings);
    speedInput.addEventListener('change', saveSettings);
    attractionInput.addEventListener('change', () => {
        settings.attraction = attractionInput.checked;
        saveSettings();
        restartDrawing();
    });

    function readPalette() {
        const style = getComputedStyle(document.documentElement);
        palette = {
            dot: style.getPropertyValue('--star-dot').trim() || '255, 255, 255',
            line: style.getPropertyValue('--star-line').trim() || '205, 220, 255',
            mouse: style.getPropertyValue('--star-mouse').trim() || '255, 190, 205'
        };
    }

    function updateCount(count) {
        if (points.length > count) points.length = count;
        while (points.length < count) {
            const angle = random(0, Math.PI * 2);
            const speed = config.speed * random(0.55, 1.45);
            points.push({
                x: random(0, width), y: random(0, height),
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed
            });
        }
    }

    function resize() {
        const oldWidth = width;
        const oldHeight = height;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        if (oldWidth && oldHeight) {
            points.forEach((point) => {
                point.x *= width / oldWidth;
                point.y *= height / oldHeight;
            });
        }
        const autoCount = clamp(Math.floor((width * height) / 17000), 55, 115);
        updateCount(settings.count ?? autoCount);
        refreshControls();
        restartDrawing();
    }

    function update(step) {
        points.forEach((point) => {
            point.x += point.vx * settings.speed * step;
            point.y += point.vy * settings.speed * step;
            if (settings.attraction && mouse.x !== null) {
                const dx = mouse.x - point.x;
                const dy = mouse.y - point.y;
                const distance = Math.hypot(dx, dy);
                if (distance > 10 && distance < config.mouseRadius) {
                    const pull = Math.min(1.8 * step, (distance - 10) * 0.14 * step);
                    const ratio = pull * (1 - distance / config.mouseRadius) / distance;
                    point.x += dx * ratio;
                    point.y += dy * ratio;
                }
            }
            if (point.x < 0 || point.x > width) {
                point.x = clamp(point.x, 0, width);
                point.vx *= -1;
            }
            if (point.y < 0 || point.y > height) {
                point.y = clamp(point.y, 0, height);
                point.vy *= -1;
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = `rgba(${palette.dot}, 0.72)`;
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
                        ctx.strokeStyle = `rgba(${palette.line}, ${alpha * 0.34})`;
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
            ctx.strokeStyle = `rgba(${palette.mouse}, ${alpha * 0.55})`;
            ctx.lineWidth = Math.max(0.45, alpha);
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        });
    }

    function loop(timestamp) {
        animationFrame = 0;
        if (motionPreference.matches || points.length === 0) return;
        const step = lastFrame ? Math.min(2, (timestamp - lastFrame) / (1000 / 60)) : 1;
        lastFrame = timestamp;
        update(step);
        draw();
        animationFrame = window.requestAnimationFrame(loop);
    }

    function restartDrawing() {
        draw();
        if (motionPreference.matches || points.length === 0) {
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            lastFrame = 0;
        } else if (!animationFrame) {
            animationFrame = window.requestAnimationFrame(loop);
        }
    }

    readPalette();
    resize();
    picker.hidden = false;
    window.addEventListener('startmenu:themechange', () => {
        readPalette();
        restartDrawing();
    });
    motionPreference.addEventListener('change', () => {
        refreshControls();
        restartDrawing();
    });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || (event.target instanceof Element && event.target.closest('.settings-dock'))) {
            mouse.x = null;
            mouse.y = null;
        } else {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }
    }, { passive: true });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    }, { passive: true });
    window.addEventListener('pagehide', () => {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastFrame = 0;
        mouse.x = null;
        mouse.y = null;
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) restartDrawing();
    });
});
