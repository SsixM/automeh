/**
 * Расписание и интерактивная база конспектов группы 108М
 */

const SCHEDULE_108M = [
    {
        dayIndex: 0,
        dayName: 'Понедельник',
        classHour: { title: 'Разговоры о важном', teacher: 'Классный час', room: 'Актовый зал' },
        pairs: [
            { num: 1, time: '08:30 – 10:00', subject: 'Математика', teacher: 'Кашаева', room: '2к302' },
            { num: 2, time: '10:10 – 12:00', subject: 'Иностранный язык', teacher: 'Шияпова', room: '2к202', isSubgroup2: true },
            { num: 3, time: '12:20 – 13:50', subject: 'ОБиЗР', teacher: 'Жукова', room: '2к407' },
            { num: 4, time: '14:00 – 15:30', subject: 'Русский язык', teacher: 'Марцынкевич', room: '2к307' }
        ]
    },
    {
        dayIndex: 1,
        dayName: 'Вторник',
        pairs: [
            { num: 1, time: '08:30 – 10:00', subject: 'Введение в специальность', teacher: 'Мингазова', room: 'каб. Мингазовой' },
            { num: 2, time: '10:10 – 12:00', subject: 'Математика', teacher: 'Кашаева', room: '2к302' },
            { num: 3, time: '12:20 – 13:50', subject: 'Химия', teacher: 'Мусина', room: '2к105' },
            { num: 4, time: '14:00 – 15:30', subject: 'Русский язык', teacher: 'Марцынкевич', room: '2к307' }
        ]
    },
    {
        dayIndex: 2,
        dayName: 'Среда',
        pairs: [
            { num: 1, time: '08:30 – 10:00', subject: 'Русский язык', teacher: 'Марцынкевич', room: '2к307' },
            { num: 2, time: '10:10 – 12:00', subject: 'Русский язык', teacher: 'Марцынкевич', room: '2к307' },
            { num: 3, time: '12:20 – 13:50', subject: 'Иностранный язык', teacher: 'Шияпова', room: '2к202', isSubgroup2: true },
            { num: 4, time: '14:00 – 15:30', subject: 'Родная литература', teacher: 'Садыкова', room: '2к301' }
        ]
    },
    {
        dayIndex: 3,
        dayName: 'Четверг',
        pairs: [
            { num: 1, time: '08:30 – 10:00', subject: 'Биология', teacher: 'Кипрова', room: 'Л307' },
            { num: 2, time: '10:10 – 12:00', subject: 'Информатика', teacher: 'Филенкова', room: '406' },
            { num: 3, time: '12:20 – 13:50', subject: 'Информатика', teacher: 'Филенкова (2 подгр.) / История (1 подгр.)', room: '406 / 227' }
        ]
    },
    {
        dayIndex: 4,
        dayName: 'Пятница',
        pairs: [
            { num: 1, time: '08:30 – 10:00', subject: 'Математика', teacher: 'Кашаева', room: '2к302' },
            { num: 2, time: '10:10 – 12:00', subject: 'Физическая культура', teacher: 'Федосеев', room: 'Спортзал' },
            { num: 3, time: '12:20 – 13:50', subject: 'История', teacher: 'Бятикова', room: '227' }
        ]
    }
];

const app = {
    data: [],
    currentView: 'schedule',
    state: {
        filter: 'all',
        tagFilter: 'all',
        search: '',
        currentPage: 1,
        itemsPerPage: 12
    },
    currentLesson: null,
    currentMode: 'full',
    quizState: {
        active: false,
        questions: [],
        currentIndex: 0,
        score: 0,
        answered: false
    },

    init() {
        this.cacheDOM();
        this.configureMarkdown();
        this.bindEvents();
        this.initData();
        this.checkURLParams();

        setTimeout(() => {
            if (this.currentView === 'schedule') {
                this.scrollToToday(false);
            }
        }, 300);
    },

    cacheDOM() {
        this.dom = {
            workspace: document.getElementById('workspace'),
            error: document.getElementById('error-msg'),
            searchInput: document.getElementById('search-input'),
            subjectFilters: document.getElementById('subject-filters'),
            tagFilters: document.getElementById('tag-filters'),
            
            tabSchedule: document.getElementById('tab-schedule'),
            tabArchive: document.getElementById('tab-archive'),
            heroTitle: document.getElementById('hero-title'),
            heroSubtitle: document.getElementById('hero-subtitle'),
            
            pagination: document.getElementById('pagination'),
            prevBtn: document.getElementById('prev-page'),
            nextBtn: document.getElementById('next-page'),
            pageInfo: document.getElementById('page-info'),
            
            lessonScene: document.getElementById('scene-lesson'),
            lessonContent: document.getElementById('lesson-content'),
            lessonSubject: document.getElementById('lesson-subject-badge'),
            lessonRoom: document.getElementById('lesson-room-badge'),
            lessonPair: document.getElementById('lesson-pair-badge'),
            lessonDate: document.getElementById('lesson-date-display'),
            lessonTagsRow: document.getElementById('lesson-tags-row'),
            tocContainer: document.getElementById('modal-toc'),
            tocList: document.getElementById('toc-list'),

            toggleModeContainer: document.getElementById('toggle-mode-container'),
            toggleSliderBar: document.getElementById('toggle-slider-bar'),
            modeBtnFull: document.getElementById('mode-btn-full'),
            modeBtnTiny: document.getElementById('mode-btn-tiny'),
            
            startQuizBtn: document.getElementById('start-quiz-btn'),
            quizScene: document.getElementById('scene-quiz'),
            quizContent: document.getElementById('quiz-content'),

            lightbox: document.getElementById('lightbox'),
            lightboxImg: document.getElementById('lightbox-img'),
            lightboxCaption: document.getElementById('lightbox-caption')
        };
    },

    configureMarkdown() {
        if (typeof marked === 'undefined') return;

        const renderer = new marked.Renderer();

        renderer.code = function(codeArg, langArg) {
            let code = '';
            let lang = '';
            
            if (typeof codeArg === 'object' && codeArg !== null) {
                code = codeArg.text || '';
                lang = codeArg.lang || '';
            } else {
                code = codeArg || '';
                lang = langArg || '';
            }

            if (lang === 'mermaid') {
                const safeCode = code.replace(/"/g, '&quot;');
                return `<div class="mermaid-wrapper"><div class="mermaid" data-code="${safeCode}">${code}</div></div>`;
            }

            let highlighted = code;
            let validLang = lang && hljs.getLanguage(lang) ? lang : '';
            if (typeof hljs !== 'undefined') {
                try {
                    highlighted = validLang ? hljs.highlight(code, { language: validLang }).value : hljs.highlightAuto(code).value;
                } catch (e) {
                    highlighted = code;
                }
            }

            const encoded = encodeURIComponent(code);
            return `
                <div class="code-card">
                    <div class="code-card-header">
                        <span class="code-card-lang">${validLang || 'КОД'}</span>
                        <button class="copy-code-btn" onclick="app.copyCodeText(this, '${encoded}')">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            <span>Копировать</span>
                        </button>
                    </div>
                    <pre><code class="hljs ${validLang}">${highlighted}</code></pre>
                </div>
            `;
        };

        marked.setOptions({
            renderer: renderer,
            gfm: true,
            breaks: true
        });

        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                themeVariables: {
                    darkMode: true,
                    background: '#12141d',
                    primaryColor: '#6366f1',
                    primaryTextColor: '#f8fafc',
                    primaryBorderColor: '#818cf8',
                    lineColor: '#38bdf8',
                    secondaryColor: '#1e2235',
                    tertiaryColor: '#171a26'
                },
                flowchart: { htmlLabels: true, curve: 'basis' }
            });
        }
    },

    parseAdvancedMarkdown(rawText) {
        if (!rawText) return '';

        // 1. Нормализация переносов строк
        let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

        // 2. Снятие внешней ложной обертки всего конспекта в ```markdown ... ```
        const outerMatch = text.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n```\s*$/i);
        if (outerMatch) {
            text = outerMatch[1].trim();
        } else {
            text = text.replace(/^```(?:markdown)?\s*\n/i, '');
            text = text.replace(/\n*```\s*$/, '');
        }

        // 3. Удаление случайных тегов и хвостов в самом конце конспекта
        text = text.replace(/\n+\s*(?:\*\*)?Теги(?:\*\*)?\s*:\s*[^\n]+$/i, '');
        text = text.replace(/\n*```\s*$/, '');

        // 4. Нормализация экранированных бэктиков
        text = text.replace(/\\(`{3,})/g, '$1');

        // 5. Исправление двойных обратных слэшей в формулах LaTeX
        text = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:\\.|[^\$\n])+\$)/g, (mathBlock) => {
            return mathBlock.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
        });

        const mathPlaceholders = [];
        const widgetPlaceholders = [];
        const calloutPlaceholders = [];

        // 6. Изоляция формул LaTeX от Marked
        text = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:\\.|[^\$\n])+\$)/g, (match) => {
            mathPlaceholders.push(match);
            return `@@MATH_SHIELD_${mathPlaceholders.length - 1}@@`;
        });

        // 7. Изоляция интерактивных виджетов
        text = text.replace(/:::graph-derivative[\s\S]*?:::/g, () => {
            const plotId = 'plot_' + Math.random().toString(36).substring(2, 9);
            const widgetHtml = `
<div class="widget-card" id="${plotId}">
<div class="widget-header">
<span class="widget-title">📈 Интерактивный график: $f(x) = x^2$ и касательная</span>
<span style="font-size: 0.8rem; color: #a5b4fc;">Live Canvas</span>
</div>
<div class="widget-body canvas-plot-container">
<canvas class="plot-canvas" width="600" height="340"></canvas>
<div class="plot-controls">
<div class="control-row">
<span class="control-label">Точка касания $x_0$: <b class="x0-display">1.0</b></span>
<input type="range" class="plot-slider" min="-2.5" max="2.5" step="0.1" value="1.0">
</div>
<div class="plot-stats-panel">
<div class="plot-stat-box"><div class="stat-name">Значение $f(x_0)$</div><div class="stat-val stat-y0">1.00</div></div>
<div class="plot-stat-box"><div class="stat-name">Производная $f'(x_0)$</div><div class="stat-val stat-k" style="color: #38bdf8;">2.00</div></div>
<div class="plot-stat-box"><div class="stat-name">Угол наклона $\\alpha$</div><div class="stat-val stat-alpha">63.4°</div></div>
</div>
</div>
</div>
</div>`;
            widgetPlaceholders.push(widgetHtml);
            return `\n\n@@WIDGET_SHIELD_${widgetPlaceholders.length - 1}@@\n\n`;
        });

        // 8. Изоляция и парсинг коллаутов (защита от экранирования в код)
        const calloutRegex = /^>[ \t]*\[!(NOTE|TIP|WARNING|DANGER|INFO|SUCCESS|FORMULA)\][ \t]*([^\n]*)\n((?:>.*(?:\n|$))*)/gim;
        text = text.replace(calloutRegex, (match, type, rawTitle, rawBody) => {
            const upperType = type.toUpperCase();
            const icons = { NOTE: 'ℹ️', INFO: '📌', TIP: '💡', WARNING: '⚠️', DANGER: '🚨', SUCCESS: '✅', FORMULA: '📐' };
            const classes = { NOTE: 'info', INFO: 'info', TIP: 'tip', WARNING: 'warning', DANGER: 'danger', SUCCESS: 'success', FORMULA: 'formula' };
            const defaultTitles = {
                NOTE: 'Определение',
                INFO: 'Информация',
                TIP: 'Совет',
                WARNING: 'Предупреждение',
                DANGER: 'Важно',
                SUCCESS: 'Успешно',
                FORMULA: 'Формула'
            };

            let lines = rawBody.split('\n').map(l => l.replace(/^>[ \t]?/, ''));
            while (lines.length > 0 && !lines[0].trim()) lines.shift();

            let title = rawTitle ? rawTitle.trim() : '';
            if (!title && lines.length > 0) {
                const firstLine = lines[0].trim();
                const titleMatch = firstLine.match(/^\*{2}(.*?)\*{2}:?\s*(.*)$/);
                if (titleMatch) {
                    title = titleMatch[1].replace(/[:*]/g, '').trim();
                    if (titleMatch[2].trim()) {
                        lines[0] = titleMatch[2].trim();
                    } else {
                        lines.shift();
                    }
                }
            }

            title = title.replace(/^>\s*/, '').replace(/^\*{2}(.*?)\*{2}:?$/, '$1').replace(/[:*]/g, '').trim();
            if (!title) title = defaultTitles[upperType] || upperType;

            const cleanBody = lines.join('\n').trim();
            const bodyHtml = marked.parse(cleanBody);

            const calloutHtml = `
<div class="callout-box callout-${classes[upperType]}">
    <div class="callout-head">
        <span class="callout-icon">${icons[upperType]}</span>
        <span class="callout-title-text">${title}</span>
    </div>
    <div class="callout-content">${bodyHtml}</div>
</div>`;
            calloutPlaceholders.push(calloutHtml);
            return `\n\n@@CALLOUT_SHIELD_${calloutPlaceholders.length - 1}@@\n\n`;
        });

        // 9. Парсинг Markdown
        let html = marked.parse(text);

        // 10. Восстановление экранированных коллаутов и виджетов
        html = html.replace(/<p>@@CALLOUT_SHIELD_(\d+)@@<\/p>/g, (m, idx) => calloutPlaceholders[idx]);
        html = html.replace(/@@CALLOUT_SHIELD_(\d+)@@/g, (m, idx) => calloutPlaceholders[idx]);

        html = html.replace(/<p>@@WIDGET_SHIELD_(\d+)@@<\/p>/g, (m, idx) => widgetPlaceholders[idx]);
        html = html.replace(/@@WIDGET_SHIELD_(\d+)@@/g, (m, idx) => widgetPlaceholders[idx]);

        // 11. Безопасный возврат формул MathJax
        html = html.replace(/@@MATH_SHIELD_(\d+)@@/g, (match, idx) => {
            return mathPlaceholders[Number(idx)] || '';
        });

        return html;
    },

    async renderMermaidSafely(container) {
        if (typeof mermaid === 'undefined') return;
        const mermaidEls = container.querySelectorAll('.mermaid');
        
        for (let i = 0; i < mermaidEls.length; i++) {
            const el = mermaidEls[i];
            let rawCode = el.getAttribute('data-code') || el.textContent.trim();
            rawCode = rawCode.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            const uniqueId = 'mermaid_' + Math.random().toString(36).substring(2, 9);
            
            try {
                const { svg } = await mermaid.render(uniqueId, rawCode);
                el.innerHTML = svg;
            } catch (err) {
                console.warn('Ошибка синтаксиса в Mermaid:', err);
                el.innerHTML = `
                    <div class="mermaid-error-fallback">
                        <b>⚠️ Ошибка построения диаграммы</b>
                        <pre style="margin-top: 6px; font-family: monospace; font-size: 0.8rem; color: #94a3b8;">${rawCode.replace(/</g, '&lt;')}</pre>
                    </div>
                `;
                const tempErr = document.getElementById(uniqueId);
                if (tempErr) tempErr.remove();
                const dErr = document.getElementById('d' + uniqueId);
                if (dErr) dErr.remove();
            }
        }
    },

    initWidgets(container) {
        container.querySelectorAll('.widget-card').forEach(card => {
            if (card.querySelector('.plot-canvas')) {
                this.setupInteractivePlot(card);
            }
        });
    },

    setupInteractivePlot(card) {
        const canvas = card.querySelector('.plot-canvas');
        const ctx = canvas.getContext('2d');
        const slider = card.querySelector('.plot-slider');
        const x0Disp = card.querySelector('.x0-display');
        const y0Disp = card.querySelector('.stat-y0');
        const kDisp = card.querySelector('.stat-k');
        const alphaDisp = card.querySelector('.stat-alpha');

        const draw = (x0) => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const originX = w / 2;
            const originY = h - 60;
            const scaleX = 70;
            const scaleY = 35;

            ctx.strokeStyle = '#1a202c';
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 35) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += 35) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(w, originY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, h); ctx.stroke();

            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let px = -originX; px < originX; px++) {
                const x = px / scaleX;
                const y = x * x;
                const canvasX = originX + px;
                const canvasY = originY - y * scaleY;
                if (px === -originX) ctx.moveTo(canvasX, canvasY);
                else ctx.lineTo(canvasX, canvasY);
            }
            ctx.stroke();

            const y0 = x0 * x0;
            const k = 2 * x0;
            const alpha = Math.atan(k) * (180 / Math.PI);

            const ptCanvasX = originX + x0 * scaleX;
            const ptCanvasY = originY - y0 * scaleY;

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            const tanX1 = -3.5;
            const tanY1 = y0 + k * (tanX1 - x0);
            const tanX2 = 3.5;
            const tanY2 = y0 + k * (tanX2 - x0);
            ctx.moveTo(originX + tanX1 * scaleX, originY - tanY1 * scaleY);
            ctx.lineTo(originX + tanX2 * scaleX, originY - tanY2 * scaleY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(ptCanvasX, ptCanvasY, 6, 0, Math.PI * 2);
            ctx.fill();

            if (x0Disp) x0Disp.textContent = Number(x0).toFixed(1);
            if (y0Disp) y0Disp.textContent = y0.toFixed(2);
            if (kDisp) kDisp.textContent = k.toFixed(2);
            if (alphaDisp) alphaDisp.textContent = alpha.toFixed(1) + '°';
        };

        slider.addEventListener('input', (e) => draw(parseFloat(e.target.value)));
        draw(parseFloat(slider.value));
    },

    getCurrentDayIndex() {
        const day = new Date().getDay();
        if (day >= 1 && day <= 5) return day - 1;
        return 0;
    },

    scrollToToday(smooth = true) {
        const targetEl = document.getElementById('day-block-today');
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        }
    },

    bindEvents() {
        this.dom.searchInput.addEventListener('input', (e) => {
            this.state.search = e.target.value.toLowerCase().trim();
            this.state.currentPage = 1;
            this.render();
        });

        this.dom.subjectFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.filter = e.target.dataset.filter;
                this.state.currentPage = 1;
                this.render();
            }
        });

        this.dom.tagFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-pill')) {
                document.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.tagFilter = e.target.dataset.tag;
                this.state.currentPage = 1;
                this.render();
            }
        });

        this.dom.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.dom.nextBtn.addEventListener('click', () => this.changePage(1));
        this.dom.startQuizBtn.addEventListener('click', () => this.startQuiz());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.dom.lightbox.classList.contains('active')) this.closeLightbox();
                else if (this.quizState.active) this.closeQuiz();
                else if (this.dom.lessonScene.classList.contains('active')) this.closeLesson();
            }
        });

        window.addEventListener('popstate', () => {
            const params = new URLSearchParams(window.location.search);
            const lessonId = params.get('lesson');
            if (lessonId) {
                const lesson = this.data.find(l => l.id === lessonId || l.title === lessonId);
                if (lesson) this.openLesson(lesson, false);
            } else {
                this.closeLesson(false);
            }
        });
    },

    initData() {
        if (typeof lessons !== 'undefined' && Array.isArray(lessons)) {
            this.data = lessons;
            this.buildFilters();
            this.render();
        } else {
            this.dom.error.textContent = 'Ошибка загрузки файла lessons.js';
            this.dom.error.style.display = 'block';
        }
    },

    buildFilters() {
        const subjects = [
            'Математика', 'Русский язык', 'Информатика', 'Химия', 'Биология',
            'История', 'ОБиЗР', 'Иностранный язык', 'Родная литература',
            'Введение в специальность', 'Физическая культура'
        ];

        this.dom.subjectFilters.innerHTML = '<button class="filter-chip active" data-filter="all">Все предметы</button>';
        subjects.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.textContent = sub;
            btn.dataset.filter = sub;
            this.dom.subjectFilters.appendChild(btn);
        });

        const tagsSet = new Set();
        this.data.forEach(l => {
            if (Array.isArray(l.tags)) l.tags.forEach(t => tagsSet.add(t));
        });

        this.dom.tagFilters.innerHTML = '<button class="tag-pill active" data-tag="all">Все теги</button>';
        tagsSet.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `tag-pill tag-${tag}`;
            btn.dataset.tag = tag;
            btn.textContent = '#' + tag;
            this.dom.tagFilters.appendChild(btn);
        });
    },

    switchView(view) {
        this.currentView = view;
        if (view === 'schedule') {
            this.dom.tabSchedule.classList.add('active');
            this.dom.tabArchive.classList.remove('active');
            this.dom.heroTitle.textContent = 'Учебный план и материалы';
            this.dom.heroSubtitle.textContent = 'Пары по звонкам, номера аудиторий, конспекты и интерактивные формулы';
            this.dom.pagination.style.display = 'none';
        } else {
            this.dom.tabArchive.classList.add('active');
            this.dom.tabSchedule.classList.remove('active');
            this.dom.heroTitle.textContent = 'Архив всех конспектов';
            this.dom.heroSubtitle.textContent = 'Полнотекстовый поиск по формулам, коду и академическим материалам';
        }
        this.render();

        if (view === 'schedule') {
            setTimeout(() => this.scrollToToday(true), 150);
        }
    },

    getSubjectColor(subject) {
        const colors = {
            'Математика': '#3b82f6',
            'Информатика': '#06b6d4',
            'Физическая культура': '#10b981',
            'Русский язык': '#ef4444',
            'Родная литература': '#f43f5e',
            'Иностранный язык': '#8b5cf6',
            'Химия': '#ec4899',
            'Биология': '#14b8a6',
            'История': '#f59e0b',
            'ОБиЗР': '#f97316',
            'Введение в специальность': '#6366f1'
        };
        return colors[subject] || '#64748b';
    },

    render() {
        if (this.currentView === 'schedule') {
            this.renderSchedule();
        } else {
            this.renderArchive();
        }
    },

    getISOWeek(date) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayNum = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - dayNum + 3);
        const firstThursday = new Date(d.getFullYear(), 0, 4);
        const firstDayNum = (firstThursday.getDay() + 6) % 7;
        firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
        const week = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
        return { year: d.getFullYear(), week };
    },

    getWeekRange(year, weekNumber) {
        const firstThursday = new Date(year, 0, 4);
        const firstDayNum = (firstThursday.getDay() + 6) % 7;
        const firstMonday = new Date(firstThursday);
        firstMonday.setDate(firstThursday.getDate() - firstDayNum);
        const start = new Date(firstMonday);
        start.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
    },

    formatWeekRange(start, end) {
        const dayOnly = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });
        const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
        if (start.getMonth() === end.getMonth()) {
            return `${dayOnly.format(start)} – ${dayMonth.format(end)}`;
        }
        return `${dayMonth.format(start)} – ${dayMonth.format(end)}`;
    },

    getCurrentWeekNumber() {
        const now = new Date();
        return this.getISOWeek(now);
    },

    getWeekDelta(weekA, weekB) {
        const { start: aStart } = this.getWeekRange(weekA.year, weekA.week);
        const { start: bStart } = this.getWeekRange(weekB.year, weekB.week);
        return Math.round((bStart - aStart) / (7 * 24 * 3600 * 1000));
    },

    parseDate(value) {
        if (value instanceof Date) return value;
        const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return new Date(value);
    },

    pluralRu(n, one, few, many) {
        const n10 = n % 10;
        const n100 = n % 100;
        if (n10 === 1 && n100 !== 11) return one;
        if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
        return many;
    },

    findLessonForPair(pair, day) {
        return this.data.find(l => {
            const matchSubj = l.subject.toLowerCase() === pair.subject.toLowerCase();
            const matchDay = (l.dayIndex !== undefined && l.dayIndex === day.dayIndex);
            const matchPair = (!l.pairNumber || l.pairNumber === pair.num);
            return matchSubj && matchDay && matchPair;
        }) || null;
    },

    renderSchedule() {
        this.dom.pagination.style.display = 'none';
        const search = this.state.search;
        const filterSubj = this.state.filter;
        const filterTag = this.state.tagFilter;
        const todayIndex = this.getCurrentDayIndex();
        const currentWeek = this.getCurrentWeekNumber();

        const dayDateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

        // Шаблон расписания с привязанными конспектами
        const daysWithPairs = SCHEDULE_108M.map(day => ({
            ...day,
            pairsData: day.pairs.map(pair => ({
                ...pair,
                lesson: this.findLessonForPair(pair, day)
            }))
        }));

        // Недели, в которых есть хотя бы один конспект
        const lessonWeeks = new Map();
        const weekKeyOf = (lesson) => {
            const wi = lesson && lesson.date ? this.getISOWeek(this.parseDate(lesson.date)) : currentWeek;
            return `${wi.year}-W${wi.week}`;
        };
        this.data.forEach(l => {
            const wi = l.date ? this.getISOWeek(this.parseDate(l.date)) : currentWeek;
            lessonWeeks.set(`${wi.year}-W${wi.week}`, wi);
        });

        if (lessonWeeks.size === 0) {
            this.dom.workspace.innerHTML = `
                <div class="schedule-empty fade-in">
                    <div class="schedule-empty-icon">🗓️</div>
                    <h3>Конспектов пока нет</h3>
                    <p>Недели появятся здесь, как только появятся конспекты занятий.</p>
                </div>
            `;
            return;
        }

        // Порядок: текущая неделя, затем прошлые (от ближайшей к давним), затем будущие
        const orderedWeeks = [...lessonWeeks.values()].sort((a, b) => {
            const da = this.getWeekDelta(currentWeek, a);
            const db = this.getWeekDelta(currentWeek, b);
            const rank = d => (d === 0 ? 0 : (d < 0 ? -d : 1000 + d));
            return rank(da) - rank(db);
        });

        let html = `<div class="schedule-view fade-in">`;
        let anyWeekRendered = false;

        orderedWeeks.forEach(wi => {
            const weekKey = `${wi.year}-W${wi.week}`;
            const { start } = this.getWeekRange(wi.year, wi.week);
            const delta = this.getWeekDelta(currentWeek, wi);
            const isCurrent = delta === 0;

            const statusText = isCurrent
                ? 'Текущая неделя'
                : (delta === -1 ? 'Прошлая неделя' : (delta < 0 ? `${-delta} нед. назад` : `Через ${delta} нед.`));

            const weekLessonCount = this.data.filter(l => weekKeyOf(l) === weekKey).length;

            let weekBody = '';
            let dayRendered = false;

            daysWithPairs.forEach(day => {
                const dayDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day.dayIndex);
                const isToday = isCurrent && day.dayIndex === todayIndex;

                const pairsData = day.pairsData.map(p => (
                    p.lesson && weekKeyOf(p.lesson) !== weekKey ? { ...p, lesson: null } : p
                ));
                const hasAnyLesson = pairsData.some(p => p.lesson !== null);

                const filteredPairs = pairsData.filter(p => {
                    if (filterSubj !== 'all' && !p.subject.toLowerCase().includes(filterSubj.toLowerCase())) return false;
                    if (filterTag !== 'all') {
                        if (!p.lesson || !Array.isArray(p.lesson.tags) || !p.lesson.tags.includes(filterTag)) return false;
                    }
                    if (search) {
                        const inSubject = p.subject.toLowerCase().includes(search);
                        const inTeacher = p.teacher.toLowerCase().includes(search);
                        const inRoom = p.room.toLowerCase().includes(search);
                        const inContent = p.lesson && (p.lesson.title.toLowerCase().includes(search) || p.lesson.content.toLowerCase().includes(search));
                        return inSubject || inTeacher || inRoom || inContent;
                    }
                    return true;
                });

                if (filteredPairs.length === 0 && (search || filterSubj !== 'all' || filterTag !== 'all')) return;
                dayRendered = true;

                weekBody += `
                <div class="day-card-group ${isToday ? 'is-today' : ''}" id="${isToday ? 'day-block-today' : `day-block-${weekKey}-${day.dayIndex}`}">
                    <div class="day-bar">
                        <div>
                            <span class="day-bar-title">${day.dayName}</span>
                            <span class="day-bar-meta">${dayDateFormatter.format(dayDate)}</span>
                        </div>
                        <div class="day-bar-badges">
                            ${isToday ? '<span class="today-accent-badge">Сегодня</span>' : ''}
                            <span class="meta-pill day-lesson-pill ${hasAnyLesson ? 'has-lessons' : ''}">
                                ${hasAnyLesson ? '🟢 Есть конспекты' : '⚪ Пары по расписанию'}
                            </span>
                        </div>
                    </div>
                `;

                if (day.classHour && (!filterSubj || filterSubj === 'all') && (!search || 'разговоры о важном'.includes(search))) {
                    weekBody += `
                    <div class="class-hour-banner">
                        <div class="class-hour-left">
                            <span class="class-hour-tag">Внеурочно</span>
                            <span class="class-hour-title">Классный час «${day.classHour.title}»</span>
                        </div>
                        <div class="class-hour-right">${day.classHour.teacher} · ${day.classHour.room}</div>
                    </div>
                    `;
                }

                weekBody += `<div class="pairs-layout">`;

                filteredPairs.forEach(pair => {
                    const color = this.getSubjectColor(pair.subject);
                    const hasLesson = pair.lesson !== null;

                    if (hasLesson) {
                        const tagsHtml = (pair.lesson.tags || []).map(t => `<span class="tag-pill tag-${t}" style="font-size: 0.72rem; padding: 2px 8px;">#${t}</span>`).join('');
                        weekBody += `
                        <div class="pair-box has-material" style="--pair-accent: ${color};" onclick="app.openLessonById('${pair.lesson.id}')">
                            <div class="pair-glow-line" style="background: ${color};"></div>
                            <div class="pair-header-row">
                                <span class="pair-index">${pair.num} ПАРА</span>
                                <span class="pair-clock">${pair.time}</span>
                            </div>
                            <div>
                                <span class="pair-room-chip ${pair.isSubgroup2 ? 'subgroup-highlight' : ''}">
                                    Кабинет: ${pair.room} ${pair.isSubgroup2 ? '(2-я группа)' : ''}
                                </span>
                            </div>
                            <div class="pair-subject-name">${pair.subject}</div>
                            <div class="pair-teacher-name">Преподаватель: ${pair.teacher}</div>
                            <div class="pair-tags-row">${tagsHtml}</div>
                            <div class="pair-footer-row">
                                <span class="pair-state ok">● ${pair.lesson.title}</span>
                                <span class="open-arrow">Открыть ➔</span>
                            </div>
                        </div>
                        `;
                    } else {
                        weekBody += `
                        <div class="pair-box no-material">
                            <div class="pair-header-row">
                                <span class="pair-index">${pair.num} ПАРА</span>
                                <span class="pair-clock">${pair.time}</span>
                            </div>
                            <div>
                                <span class="pair-room-chip ${pair.isSubgroup2 ? 'subgroup-highlight' : ''}">
                                    Кабинет: ${pair.room} ${pair.isSubgroup2 ? '(2-я группа)' : ''}
                                </span>
                            </div>
                            <div class="pair-subject-name" style="color: var(--text-secondary);">${pair.subject}</div>
                            <div class="pair-teacher-name">Преподаватель: ${pair.teacher}</div>
                            <div class="pair-footer-row">
                                <span class="pair-state muted">○ Нет конспекта</span>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">по плану</span>
                            </div>
                        </div>
                        `;
                    }
                });

                weekBody += `</div></div>`;
            });

            if (!dayRendered) return;

            anyWeekRendered = true;
            html += `
            <section class="week-group ${isCurrent ? 'is-current' : ''}" id="week-${weekKey}">
                <div class="week-header">
                    <div class="week-header-left">
                        <span class="week-index">Неделя ${wi.week}</span>
                        <span class="week-range">${this.formatWeekRange(start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))}</span>
                        <span class="week-status ${isCurrent ? 'current' : ''}">${statusText}</span>
                    </div>
                    <div class="week-header-right">
                        <span class="week-lesson-count">
                            <span class="count-dot"></span>
                            ${weekLessonCount} ${this.pluralRu(weekLessonCount, 'конспект', 'конспекта', 'конспектов')}
                        </span>
                    </div>
                </div>
                ${weekBody}
            </section>
            `;
        });

        html += `</div>`;

        if (!anyWeekRendered) {
            html = `
                <div class="schedule-empty fade-in">
                    <div class="schedule-empty-icon">🔍</div>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить запрос или сбросить фильтры.</p>
                </div>
            `;
        }

        this.dom.workspace.innerHTML = html;
    },

    renderArchive() {
        let list = this.data.filter(l => {
            const matchSubj = this.state.filter === 'all' || l.subject === this.state.filter;
            const matchTag = this.state.tagFilter === 'all' || (Array.isArray(l.tags) && l.tags.includes(this.state.tagFilter));
            const matchSearch = !this.state.search || (
                l.title.toLowerCase().includes(this.state.search) ||
                l.subject.toLowerCase().includes(this.state.search) ||
                l.content.toLowerCase().includes(this.state.search)
            );
            return matchSubj && matchTag && matchSearch;
        });

        const total = list.length;
        const pages = Math.ceil(total / this.state.itemsPerPage) || 1;
        if (this.state.currentPage > pages) this.state.currentPage = pages;
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageData = list.slice(start, start + this.state.itemsPerPage);

        if (total === 0) {
            this.dom.workspace.innerHTML = `
                <div style="text-align: center; padding: 5rem 1rem; color: var(--text-muted);">
                    <h3>Ничего не найдено</h3>
                    <p style="font-size: 0.95rem; margin-top: 0.5rem;">Попробуйте выбрать другой тег или сбросить фильтры</p>
                </div>
            `;
            this.dom.pagination.style.display = 'none';
            return;
        }

        let html = `<div class="pairs-layout fade-in">`;
        pageData.forEach(l => {
            const color = this.getSubjectColor(l.subject);
            const tagsHtml = (l.tags || []).map(t => `<span class="tag-pill tag-${t}" style="font-size: 0.72rem; padding: 2px 8px;">#${t}</span>`).join('');
            html += `
                <div class="pair-box has-material" style="--pair-accent: ${color};" onclick="app.openLessonById('${l.id}')">
                    <div class="pair-glow-line" style="background: ${color};"></div>
                    <div class="pair-header-row">
                        <span class="pair-index">${l.pairNumber ? l.pairNumber + ' ПАРА' : 'КОНСПЕКТ'}</span>
                        <span class="pair-clock">${l.date || '108М'}</span>
                    </div>
                    <div>
                        <span class="pair-room-chip">${l.room || 'каб. 108М'}</span>
                    </div>
                    <div class="pair-subject-name">${l.title}</div>
                    <div class="pair-teacher-name">${l.subject} · ${l.teacher || 'Группа 108М'}</div>
                    <div class="pair-tags-row">${tagsHtml}</div>
                    <div class="pair-footer-row">
                        <span class="pair-state ok">● Открыть материал</span>
                        <span class="open-arrow">➔</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        this.dom.workspace.innerHTML = html;
        this.dom.pagination.style.display = pages > 1 ? 'flex' : 'none';
        this.dom.pageInfo.textContent = `${this.state.currentPage} / ${pages}`;
        this.dom.prevBtn.disabled = this.state.currentPage === 1;
        this.dom.nextBtn.disabled = this.state.currentPage === pages;
    },

    changePage(delta) {
        this.state.currentPage += delta;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.render();
    },

    openLessonById(id) {
        const lesson = this.data.find(l => l.id === id || l.title === id);
        if (lesson) this.openLesson(lesson);
    },

    openLesson(lesson, pushState = true) {
        this.currentLesson = lesson;
        this.currentMode = 'full';

        if (lesson.quiz && Array.isArray(lesson.quiz) && lesson.quiz.length > 0) {
            this.dom.startQuizBtn.style.display = 'flex';
            this.quizState.questions = lesson.quiz;
        } else {
            this.dom.startQuizBtn.style.display = 'none';
            this.quizState.questions = [];
        }

        const color = this.getSubjectColor(lesson.subject);
        this.dom.lessonSubject.textContent = lesson.subject;
        this.dom.lessonSubject.style.backgroundColor = `${color}20`;
        this.dom.lessonSubject.style.color = color;

        this.dom.lessonRoom.textContent = lesson.room ? `Кабинет: ${lesson.room}` : 'Кабинет 108М';
        this.dom.lessonPair.textContent = lesson.pairNumber ? `${lesson.pairNumber} Пара` : 'Материал';
        this.dom.lessonDate.textContent = lesson.date || 'Учебный семестр 108М';

        this.dom.lessonTagsRow.innerHTML = (lesson.tags || []).map(t => `<span class="tag-pill tag-${t}">#${t}</span>`).join('');

        if (lesson.content_tiny && lesson.content_tiny.trim().length > 0) {
            this.dom.toggleModeContainer.style.display = 'flex';
            this.setToggleVisual('full');
        } else {
            this.dom.toggleModeContainer.style.display = 'none';
        }

        this.renderLessonBody(lesson.content);

        this.dom.lessonScene.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (pushState) {
            const url = new URL(window.location);
            url.searchParams.set('lesson', lesson.id);
            window.history.pushState({ lessonId: lesson.id }, '', url);
        }
        this.dom.lessonContent.scrollTop = 0;
    },

    renderLessonBody(content) {
        this.dom.lessonContent.innerHTML = this.parseAdvancedMarkdown(content);
        this.generateTOC();

        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetClear();
            MathJax.typesetPromise([this.dom.lessonContent]).catch(e => console.warn(e));
        }

        this.renderMermaidSafely(this.dom.lessonContent);
        this.initWidgets(this.dom.lessonContent);
    },

    switchContentMode(mode) {
        if (!this.currentLesson || this.currentMode === mode) return;
        this.currentMode = mode;
        this.setToggleVisual(mode);

        const content = (mode === 'tiny' && this.currentLesson.content_tiny) 
            ? this.currentLesson.content_tiny 
            : this.currentLesson.content;

        this.dom.lessonContent.style.opacity = '0';
        setTimeout(() => {
            this.renderLessonBody(content);
            this.dom.lessonContent.style.opacity = '1';
        }, 150);
    },

    setToggleVisual(mode) {
        if (mode === 'full') {
            this.dom.modeBtnFull.classList.add('active');
            this.dom.modeBtnTiny.classList.remove('active');
            this.dom.toggleSliderBar.style.transform = 'translateX(0)';
        } else {
            this.dom.modeBtnTiny.classList.add('active');
            this.dom.modeBtnFull.classList.remove('active');
            this.dom.toggleSliderBar.style.transform = 'translateX(100%)';
        }
    },

    generateTOC() {
        this.dom.tocList.innerHTML = '';
        const headings = this.dom.lessonContent.querySelectorAll('h2, h3');
        if (headings.length === 0) {
            this.dom.tocContainer.style.display = 'none';
            return;
        }
        this.dom.tocContainer.style.display = 'block';
        headings.forEach((h, i) => {
            const id = `toc-head-${i}`;
            h.id = id;
            const link = document.createElement('a');
            link.className = `toc-item-link level-${h.tagName.substring(1)}`;
            link.textContent = h.textContent;
            link.href = `#${id}`;
            link.onclick = (e) => {
                e.preventDefault();
                h.scrollIntoView({ behavior: 'smooth' });
            };
            this.dom.tocList.appendChild(link);
        });
    },

    closeLesson(pushState = true) {
        this.dom.lessonScene.classList.remove('active');
        if (pushState) {
            const url = new URL(window.location);
            url.searchParams.delete('lesson');
            window.history.pushState({}, '', url);
        }
        setTimeout(() => {
            document.body.style.overflow = '';
            this.dom.lessonContent.innerHTML = '';
        }, 200);
    },

    checkURLParams() {
        const params = new URLSearchParams(window.location.search);
        const lessonId = params.get('lesson');
        if (lessonId) {
            const found = this.data.find(l => l.id === lessonId || l.title === lessonId);
            if (found) this.openLesson(found, false);
        }
    },

    copyLessonMarkdown() {
        if (!this.currentLesson) return;
        navigator.clipboard.writeText(`# ${this.currentLesson.title}\n\n${this.currentLesson.content}`).then(() => {
            alert('Конспект скопирован в формате Markdown!');
        });
    },

    printLesson() { window.print(); },

    copyCodeText(btn, encoded) {
        const text = decodeURIComponent(encoded);
        navigator.clipboard.writeText(text).then(() => {
            const span = btn.querySelector('span');
            const orig = span.textContent;
            span.textContent = 'Скопировано!';
            setTimeout(() => span.textContent = orig, 1800);
        });
    },

    openLightbox(src, caption) {
        this.dom.lightboxImg.src = src;
        this.dom.lightboxCaption.textContent = caption || '';
        this.dom.lightbox.classList.add('active');
    },

    closeLightbox() {
        this.dom.lightbox.classList.remove('active');
        setTimeout(() => {
            this.dom.lightboxImg.src = '';
            this.dom.lightboxCaption.textContent = '';
        }, 200);
    },

    startQuiz() {
        this.quizState.active = true;
        this.quizState.currentIndex = 0;
        this.quizState.score = 0;
        this.dom.quizScene.classList.add('active');
        this.renderQuizQuestion();
    },

    renderQuizQuestion() {
        this.quizState.answered = false;
        const qIndex = this.quizState.currentIndex;
        const q = this.quizState.questions[qIndex];
        const total = this.quizState.questions.length;

        const optionsHtml = q.options.map((opt, i) => `
            <button class="choice-btn" onclick="app.answerQuiz(${i}, this)">
                ${this.parseAdvancedMarkdown(opt)}
            </button>
        `).join('');

        this.dom.quizContent.innerHTML = `
            <div class="quiz-progress-text">Вопрос ${qIndex + 1} из ${total}</div>
            <div class="quiz-q-title">${this.parseAdvancedMarkdown(q.question)}</div>
            <div class="quiz-choices">${optionsHtml}</div>
            <div id="quiz-exp-slot" style="display: none;"></div>
        `;
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([this.dom.quizContent]);
        }
    },

    answerQuiz(selectedIdx, btn) {
        if (this.quizState.answered) return;
        this.quizState.answered = true;

        const q = this.quizState.questions[this.quizState.currentIndex];
        const isOk = (selectedIdx === q.correct);
        const allBtns = this.dom.quizContent.querySelectorAll('.choice-btn');
        allBtns.forEach(b => b.disabled = true);

        if (isOk) {
            btn.classList.add('correct');
            this.quizState.score++;
        } else {
            btn.classList.add('wrong');
            allBtns[q.correct].classList.add('correct');
        }

        const expSlot = document.getElementById('quiz-exp-slot');
        if (expSlot && q.explanation) {
            expSlot.className = 'quiz-exp-block';
            expSlot.innerHTML = `
                <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.4rem;">Пояснение:</div>
                <div>${this.parseAdvancedMarkdown(q.explanation)}</div>
                <button class="btn-primary" style="margin-top: 1rem; padding: 8px 16px;" onclick="app.nextQuizQuestion()">
                    ${this.quizState.currentIndex + 1 < this.quizState.questions.length ? 'Следующий вопрос ➔' : 'Результаты теста'}
                </button>
            `;
            expSlot.style.display = 'block';
            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise([expSlot]);
            }
        } else {
            setTimeout(() => this.nextQuizQuestion(), 1300);
        }
    },

    nextQuizQuestion() {
        this.quizState.currentIndex++;
        if (this.quizState.currentIndex < this.quizState.questions.length) {
            this.renderQuizQuestion();
        } else {
            this.dom.quizContent.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 0;">
                    <div style="font-size: 3.8rem; font-weight: 800; color: var(--primary);">${this.quizState.score} / ${this.quizState.questions.length}</div>
                    <div style="font-size: 1.2rem; color: #fff; margin: 1rem 0 2rem;">
                        ${this.quizState.score === this.quizState.questions.length ? 'Отличный результат! Материал усвоен без ошибок.' : 'Тест пройден. Повторите ключевые формулы.'}
                    </div>
                    <button class="btn-primary" style="padding: 12px 28px;" onclick="app.closeQuiz()">Вернуться к уроку</button>
                </div>
            `;
        }
    },

    closeQuiz() {
        this.quizState.active = false;
        this.dom.quizScene.classList.remove('active');
        setTimeout(() => { this.dom.quizContent.innerHTML = ''; }, 200);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());