// 管理主题切换、壁纸取色和配色记忆。
(() => {
    const root = document.documentElement;
    const storageKey = 'bohese-startmenu-theme';
    const seedKey = 'bohese-startmenu-monet-seed';
    const defaultTheme = 'violet';
    const themes = ['light', 'dark', 'blue', 'violet', 'monet'];
    const validSeed = (value) => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
    const rgbOf = (hex) => hex.slice(1).match(/../g).map((part) => parseInt(part, 16));
    const toHex = (channels) => '#' + channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('');
    const mix = (color, base, weight) => color.map((channel, index) => Math.round(channel * weight + base[index] * (1 - weight)));
    let seed = null;

    // 把取到的颜色写入 CSS 变量，作为莫奈主题的配色基础。
    function setSeed(color) {
        seed = color.toLowerCase();
        root.style.setProperty('--monet-seed', seed);
        root.style.setProperty('--monet-star', mix(rgbOf(seed), [68, 84, 107], 0.48).join(', '));
    }

    // 脚本放在页面头部，在渲染主体之前恢复上次使用的配色。
    try {
        const savedSeed = localStorage.getItem(seedKey);
        if (validSeed(savedSeed)) setSeed(savedSeed);
        const saved = localStorage.getItem(storageKey);
        root.dataset.theme = themes.includes(saved) && (saved !== 'monet' || seed) ? saved : defaultTheme;
    } catch {
        root.dataset.theme = defaultTheme;
    }

    // 缩小壁纸并读取像素，从经常出现的颜色里挑选一个代表色。
    async function extractWallpaperColor(file) {
        if (file.size > 25 * 1024 * 1024) throw new Error('图片不能超过 25 MB');
        const image = await createImageBitmap(file, { resizeWidth: 72, resizeHeight: 72 });
        try {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
            const bins = new Map();
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 160) continue;
                const [r, g, b] = data.subarray(i, i + 3);
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                // Frequent colors win, with a modest boost for colors that visibly tint the theme.
                const weight = 0.45 + (max - min) / 255 * 1.3 + (1 - Math.abs((max + min) / 255 - 1)) * 0.3;
                const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
                const bin = bins.get(key) || { weight: 0, count: 0, sum: [0, 0, 0] };
                bin.weight += weight;
                bin.count += 1;
                bin.sum[0] += r;
                bin.sum[1] += g;
                bin.sum[2] += b;
                bins.set(key, bin);
            }
            const dominant = [...bins.values()].reduce((best, bin) => !best || bin.weight > best.weight ? bin : best, null);
            if (!dominant) throw new Error('没有找到可用的颜色');
            return toHex(dominant.sum.map((total) => total / dominant.count));
        } finally {
            image.close();
        }
    }

    // 等 HTML 解析完成后，再绑定主题面板里的控件。
    document.addEventListener('DOMContentLoaded', () => {
        const picker = document.getElementById('themePicker');
        const toggle = document.getElementById('themeToggle');
        const panel = document.getElementById('themePanel');
        const options = Array.from(panel.querySelectorAll('[data-theme-choice]'));
        const themeColor = document.querySelector('meta[name="theme-color"]');
        const monetToggle = document.getElementById('monetToggle');
        const monetControls = document.getElementById('monetControls');
        const sampleDesktop = document.getElementById('sampleDesktop');
        const selectWallpaper = document.getElementById('selectWallpaper');
        const wallpaperFile = document.getElementById('wallpaperFile');
        const monetColor = document.getElementById('monetColor');
        const monetStatus = document.getElementById('monetStatus');
        const useMonet = document.getElementById('useMonet');
        let extracting = false;

        // 改变 html 上的 data-theme，让 CSS 和粒子背景跟着更新。
        function applyTheme(theme, save = false) {
            root.dataset.theme = theme;
            options.forEach((option) => {
                option.setAttribute('aria-pressed', String(option.dataset.themeChoice === theme));
            });
            themeColor.content = theme === 'monet'
                ? toHex(mix(rgbOf(seed), [243, 246, 251], 0.21))
                : getComputedStyle(root).getPropertyValue('--bg-deep').trim();
            window.dispatchEvent(new Event('startmenu:themechange'));
            useMonet.hidden = !seed || theme === 'monet';
            if (!save) return;
            try {
                if (theme === 'monet') localStorage.setItem(seedKey, seed);
                localStorage.setItem(storageKey, theme);
            } catch {
                // The chosen theme still applies if storage is unavailable.
            }
        }

        function setStatus(message) {
            monetStatus.hidden = !message;
            monetStatus.textContent = message;
        }

        function useSeed(color) {
            if (!validSeed(color)) return;
            setSeed(color);
            monetColor.value = seed;
            applyTheme('monet', true);
            setStatus(`已应用配色 · ${seed.toUpperCase()}`);
        }

        function setMonetOpen(open) {
            monetControls.hidden = !open;
            monetToggle.setAttribute('aria-expanded', String(open));
            if (open) monetControls.scrollIntoView({ block: 'nearest' });
        }

        function setOpen(open, returnFocus = false) {
            panel.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            if (!open) {
                setMonetOpen(false);
                setStatus('');
            }
            if (returnFocus) toggle.focus();
        }

        // 点击按钮可切换主题，也可用手选、屏幕吸色或壁纸生成配色。
        toggle.addEventListener('click', () => setOpen(panel.hidden));
        options.forEach((option) => option.addEventListener('click', () => {
            applyTheme(option.dataset.themeChoice, true);
            setOpen(false, true);
        }));
        monetToggle.addEventListener('click', () => setMonetOpen(monetControls.hidden));
        if (seed) monetColor.value = seed;
        monetColor.addEventListener('change', () => useSeed(monetColor.value));
        useMonet.addEventListener('click', () => {
            if (seed) useSeed(seed);
            monetToggle.focus();
        });
        sampleDesktop.hidden = typeof window.EyeDropper !== 'function';
        sampleDesktop.addEventListener('click', async () => {
            try {
                const { sRGBHex } = await new window.EyeDropper().open();
                useSeed(sRGBHex);
            } catch (error) {
                if (error.name !== 'AbortError') setStatus('无法使用屏幕吸色，请选择壁纸或手选颜色。');
            }
        });
        selectWallpaper.addEventListener('click', () => wallpaperFile.click());
        wallpaperFile.addEventListener('change', async () => {
            const file = wallpaperFile.files[0];
            wallpaperFile.value = '';
            if (!file || extracting) return;
            extracting = true;
            selectWallpaper.disabled = true;
            try {
                if (file.size > 25 * 1024 * 1024) {
                    setStatus('请选择 25 MB 以内的壁纸。');
                    return;
                }
                useSeed(await extractWallpaperColor(file));
            } catch {
                setStatus('无法读取这张图片，请换一张 JPG、PNG 或 WebP 壁纸。');
            } finally {
                extracting = false;
                selectWallpaper.disabled = false;
            }
        });
        document.addEventListener('click', (event) => {
            if (!panel.hidden && !picker.contains(event.target)) setOpen(false);
        });
        document.addEventListener('focusin', (event) => {
            if (!panel.hidden && !picker.contains(event.target)) setOpen(false);
        });
        document.addEventListener('keydown', (event) => {
            if (!panel.hidden && event.key === 'Escape') setOpen(false, true);
        });

        applyTheme(root.dataset.theme);
        picker.hidden = false;
    }, { once: true });
})();
