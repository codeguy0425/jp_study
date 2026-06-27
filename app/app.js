let COURSE, FLASH_KANA, KANA_CHART, DAKUON_CHART;

const App = {
  state: {
    tab: 'home',
    viewingWeek: null,
    quizWeek: null,
    quizSubmitted: false,
    flashcardMode: false,
    flashcardFilter: 'all',
    flashcardDeck: [],
    flashcardIdx: 0,
    flashcardFlipped: false,
    flashcardKnown: JSON.parse(localStorage.getItem('jp_flash_known') || '[]'),
    done: JSON.parse(localStorage.getItem('jp_done') || '[]'),
    scores: JSON.parse(localStorage.getItem('jp_scores') || '{}')
  },

  async init() {
    await this.loadCourseData();
    this.renderLessons();
    this.renderProgress();
    this.updateHomeStats();
    document.addEventListener('keydown', e => {
      if (!this.state.flashcardMode) return;
      if (e.key === 'ArrowRight') { this.nextCard(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { this.prevCard(); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Space') { this.flipFlashcard(); e.preventDefault(); }
    });
  },

  async loadCourseData() {
    const r = await fetch('course.json');
    const d = await r.json();
    COURSE = d.COURSE;
    FLASH_KANA = d.FLASH_KANA;
    KANA_CHART = d.KANA_CHART;
    DAKUON_CHART = d.DAKUON_CHART;
  },

  save() {
    localStorage.setItem('jp_done', JSON.stringify(this.state.done));
    localStorage.setItem('jp_scores', JSON.stringify(this.state.scores));
    localStorage.setItem('jp_flash_known', JSON.stringify(this.state.flashcardKnown));
    this.updateHomeStats();
    this.renderProgress();
    this.renderLessons();
  },

  switchTab(tab) {
    this.state.tab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('backBtn').classList.remove('visible');
    if (tab === 'lessons') { this.renderLessons(); }
    if (tab === 'quiz') { this.renderQuiz(); }
    if (tab === 'kana') { this.renderKanaChart(); }
    if (tab === 'progress') { this.renderProgress(); }
    document.getElementById('appMain').scrollTop = 0;
  },

  goBack() {
    if (this.state.flashcardMode) {
      this.state.flashcardMode = false;
      this.state.flashcardFlipped = false;
      this.renderQuiz();
      document.getElementById('backBtn').classList.remove('visible');
      return;
    }
    if (this.state.viewingWeek !== null) {
      this.state.viewingWeek = null;
      this.renderLessons();
    } else if (this.state.quizWeek !== null) {
      this.state.quizWeek = null;
      this.state.quizSubmitted = false;
      this.renderQuiz();
    }
  },

  openLesson(id) {
    this.state.viewingWeek = id;
    const backBtn = document.getElementById('backBtn');
    backBtn.classList.add('visible');
    this.renderLessonDetail(id);
    document.getElementById('appMain').scrollTop = 0;
  },

  /* ─── kana chart ─── */
  renderKanaChart() {
    const container = document.getElementById('kanaChartContent');
    const cols = ['a', 'i', 'u', 'e', 'o'];
    const colLabels = ['あ段', 'い段', 'う段', 'え段', 'お段'];

    const renderTable = (data, title) => {
      let h = `<div class="section-title" style="margin-top:var(--spacing-xl);">${title}</div>
        <div class="kana-chart-scroll"><table class="kana-chart">
        <thead><tr><th></th>${colLabels.map(l => `<th>${l}</th>`).join('')}</tr></thead><tbody>`;
      data.forEach(row => {
        h += `<tr><td class="row-label">${row.label}</td>`;
        cols.forEach(c => {
          const k = row[c];
          if (!k) { h += `<td class="empty"></td>`; return; }
          h += `<td class="kana-cell-lg" onclick="App.speak('${k.h}')">
            <span class="hira">${k.h}</span>
            <span class="kata">${k.k}</span>
            <span class="rom">${k.r}</span>
          </td>`;
        });
        h += `</tr>`;
      });
      h += `</tbody></table></div>`;
      return h;
    };

    let html = `<h2 style="font-size:18px;font-weight:600;margin-bottom:var(--spacing-sm);">五十音圖</h2>
      <p style="font-size:13px;color:var(--on-dark-muted);margin-bottom:var(--spacing-lg);line-height:1.7;">點擊任一儲存格聽發音 · 上為平假名 · 下為片假名</p>`;

    html += renderTable(KANA_CHART, '清音');
    html += renderTable(DAKUON_CHART, '濁音 · 半濁音');

    html += `<div class="section-title" style="margin-top:var(--spacing-xl);">拗音</div>
      <div class="kana-chart-scroll"><table class="kana-chart compact">
      <thead><tr><th></th><th>や</th><th>ゆ</th><th>よ</th></tr></thead><tbody>`;
    const yoon = [
      { label: 'き行', a: { h: 'きゃ', k: 'キャ', r: 'kya' }, i: { h: 'きゅ', k: 'キュ', r: 'kyu' }, u: { h: 'きょ', k: 'キョ', r: 'kyo' } },
      { label: 'し行', a: { h: 'しゃ', k: 'シャ', r: 'sha' }, i: { h: 'しゅ', k: 'シュ', r: 'shu' }, u: { h: 'しょ', k: 'ショ', r: 'sho' } },
      { label: 'ち行', a: { h: 'ちゃ', k: 'チャ', r: 'cha' }, i: { h: 'ちゅ', k: 'チュ', r: 'chu' }, u: { h: 'ちょ', k: 'チョ', r: 'cho' } },
      { label: 'に行', a: { h: 'にゃ', k: 'ニャ', r: 'nya' }, i: { h: 'にゅ', k: 'ニュ', r: 'nyu' }, u: { h: 'にょ', k: 'ニョ', r: 'nyo' } },
      { label: 'ひ行', a: { h: 'ひゃ', k: 'ヒャ', r: 'hya' }, i: { h: 'ひゅ', k: 'ヒュ', r: 'hyu' }, u: { h: 'ひょ', k: 'ヒョ', r: 'hyo' } },
      { label: 'み行', a: { h: 'みゃ', k: 'ミャ', r: 'mya' }, i: { h: 'みゅ', k: 'ミュ', r: 'myu' }, u: { h: 'みょ', k: 'ミョ', r: 'myo' } },
      { label: 'り行', a: { h: 'りゃ', k: 'リャ', r: 'rya' }, i: { h: 'りゅ', k: 'リュ', r: 'ryu' }, u: { h: 'りょ', k: 'リョ', r: 'ryo' } },
      { label: 'ぎ行', a: { h: 'ぎゃ', k: 'ギャ', r: 'gya' }, i: { h: 'ぎゅ', k: 'ギュ', r: 'gyu' }, u: { h: 'ぎょ', k: 'ギョ', r: 'gyo' } },
      { label: 'じ行', a: { h: 'じゃ', k: 'ジャ', r: 'ja' }, i: { h: 'じゅ', k: 'ジュ', r: 'ju' }, u: { h: 'じょ', k: 'ジョ', r: 'jo' } },
      { label: 'び行', a: { h: 'びゃ', k: 'ビャ', r: 'bya' }, i: { h: 'びゅ', k: 'ビュ', r: 'byu' }, u: { h: 'びょ', k: 'ビョ', r: 'byo' } },
      { label: 'ぴ行', a: { h: 'ぴゃ', k: 'ピャ', r: 'pya' }, i: { h: 'ぴゅ', k: 'ピュ', r: 'pyu' }, u: { h: 'ぴょ', k: 'ピョ', r: 'pyo' } },
    ];
    const yCols = ['a', 'i', 'u'];
    const yColLabels = ['や段', 'ゆ段', 'よ段'];
    yoon.forEach(r => {
      html += `<tr><td class="row-label">${r.label}</td>`;
      yCols.forEach(c => {
        const k = r[c];
        if (!k) { html += `<td class="empty"></td>`; return; }
        html += `<td class="kana-cell-lg" onclick="App.speak('${k.h}')">
          <span class="hira">${k.h}</span>
          <span class="kata">${k.k}</span>
          <span class="rom">${k.r}</span>
        </td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    container.innerHTML = html;
  },

  /* ─── flashcard ─── */
  buildDeck(filter) {
    const cards = [];
    FLASH_KANA.forEach(k => {
      if (filter === 'all' || filter === 'hiragana') cards.push({ type: 'hiragana', char: k.h, rom: k.r });
      if (filter === 'all' || filter === 'katakana') cards.push({ type: 'katakana', char: k.k, rom: k.r });
    });
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  },

  openFlashcard(filter) {
    this.state.flashcardFilter = filter || 'all';
    this.state.flashcardDeck = this.buildDeck(this.state.flashcardFilter);
    this.state.flashcardMode = true;
    this.state.flashcardIdx = 0;
    this.state.flashcardFlipped = false;
    document.getElementById('backBtn').classList.add('visible');
    this.renderFlashcard();
  },

  switchFlashcardFilter(filter) {
    this.state.flashcardFilter = filter;
    this.state.flashcardDeck = this.buildDeck(filter);
    this.state.flashcardIdx = 0;
    this.state.flashcardFlipped = false;
    this.renderFlashcard();
  },

  renderFlashcard() {
    const container = document.getElementById('quizContent');
    const deck = this.state.flashcardDeck;
    const total = deck.length;
    const idx = this.state.flashcardIdx;
    const card = deck[idx];
    const knownKey = card.type === 'hiragana' ? 'h_' : 'k_' + card.rom;
    const isKnown = this.state.flashcardKnown.includes(knownKey);
    const isLast = idx + 1 >= total;

    const filterLabels = { all: '全部', hiragana: '平假名', katakana: '片假名' };

    let html = `<div class="flashcard-filter-bar">
      ${Object.entries(filterLabels).map(([k, v]) =>
        `<button class="fc-filter-btn${this.state.flashcardFilter === k ? ' active' : ''}" onclick="App.switchFlashcardFilter('${k}')">${v}</button>`
      ).join('')}
    </div>
    <div class="flashcard-wrap">
      <div class="flashcard-counter">${idx + 1} / ${total}</div>
      <div class="flashcard-nav">
        <button class="fc-nav-btn" onclick="App.prevCard()" ${idx === 0 ? 'disabled' : ''}>◀</button>
        <span class="fc-nav-label">${card.type === 'hiragana' ? '平假名' : '片假名'} · ${card.rom}</span>
        <button class="fc-nav-btn" onclick="App.nextCard()" ${isLast ? 'disabled' : ''}>▶</button>
      </div>
      <div class="flashcard${this.state.flashcardFlipped ? ' flipped' : ''}" onclick="App.flipFlashcard()">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <div class="fc-char">${card.char}</div>
            <div class="fc-label">${card.type === 'hiragana' ? '平假名' : '片假名'} · 點擊翻面</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="fc-char">${card.char}</div>
            <div class="fc-rom">${card.rom}</div>
            <div class="fc-label">${card.type === 'hiragana' ? '平假名' : '片假名'}</div>
          </div>
        </div>
      </div>`;

    if (this.state.flashcardFlipped) {
      html += `<div class="flashcard-hint">記得了嗎？</div>
        <div class="flashcard-actions">
          <button class="btn-unknown" onclick="App.flashcardResult(false)" title="還不熟">✗</button>
          <button class="btn-known" onclick="App.flashcardResult(true)" title="記得了">✓</button>
        </div>`;
    }

    html += `<div class="flashcard-nav-bottom">
        <button class="flashcard-next-btn" onclick="App.nextCard()" ${isLast ? 'disabled' : ''}>→ 下一張</button>
      </div>
      <div class="flashcard-key-hint">鍵盤快捷：← 上一張 · → 下一張 · 空白鍵翻面</div>
    </div>`;
    container.innerHTML = html;

    const wrap = container.querySelector('.flashcard-wrap');
    if (wrap) {
      // swipe removed — touch to flip works via onclick on .flashcard
    }
  },

  flipFlashcard() {
    this.state.flashcardFlipped = !this.state.flashcardFlipped;
    const el = document.querySelector('.flashcard');
    if (el) el.classList.toggle('flipped');
    if (this.state.flashcardFlipped) {
      const card = this.state.flashcardDeck[this.state.flashcardIdx];
      if (card) this.speak(card.char);
    }
  },

  flashcardResult(known) {
    const deck = this.state.flashcardDeck;
    const idx = this.state.flashcardIdx;
    const card = deck[idx];
    const knownKey = (card.type === 'hiragana' ? 'h_' : 'k_') + card.rom;

    if (known && !this.state.flashcardKnown.includes(knownKey)) {
      this.state.flashcardKnown.push(knownKey);
    } else if (!known) {
      this.state.flashcardKnown = this.state.flashcardKnown.filter(k => k !== knownKey);
    }
    this.save();

    if (idx + 1 < deck.length) {
      this.state.flashcardIdx++;
      this.state.flashcardFlipped = false;
      this.renderFlashcard();
    } else {
      const known = this.state.flashcardKnown.length;
      const total = FLASH_KANA.length * 2;
      document.getElementById('quizContent').innerHTML = `<div class="quiz-result" style="margin-top:0;">
        <div class="score">${known}/${total}</div>
        <div class="score-label">已熟悉（全部 ${Object.keys(filterLabels).length} 種）</div>
        <div class="msg">${known === total ? '🎉 全部記住了！太棒了！' : known > total * 0.7 ? '👏 進度不錯，繼續加油！' : '💪 多練習幾次就會記住了！'}</div>
        <button class="quiz-submit" onclick="App.state.flashcardMode=false;App.switchTab('home')" style="margin-top:var(--spacing-lg);">返回首頁</button>
        <button class="quiz-submit" onclick="App.restartFlashcard()" style="margin-top:var(--spacing-sm);background:var(--accent-violet-mid);">再次練習</button>
      </div>`;
    }
  },

  nextCard() {
    const deck = this.state.flashcardDeck;
    if (this.state.flashcardIdx + 1 >= deck.length) return;
    this.state.flashcardIdx++;
    this.state.flashcardFlipped = false;
    this.renderFlashcard();
  },

  prevCard() {
    if (this.state.flashcardIdx <= 0) return;
    this.state.flashcardIdx--;
    this.state.flashcardFlipped = false;
    this.renderFlashcard();
  },

  restartFlashcard() {
    this.state.flashcardDeck = this.buildDeck(this.state.flashcardFilter);
    this.state.flashcardIdx = 0;
    this.state.flashcardFlipped = false;
    this.state.flashcardMode = true;
    this.renderFlashcard();
  },

  speak(text, rate = 0.9) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = rate;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  },

  /* ─── render lessons ─── */
  renderLessons() {
    const list = document.getElementById('lessonList');
    const detail = document.getElementById('lessonDetail');
    list.style.display = 'block';
    detail.classList.remove('active');
    detail.innerHTML = '';
    const backBtn = document.getElementById('backBtn');

    if (this.state.viewingWeek !== null) {
      backBtn.classList.add('visible');
      return;
    }
    backBtn.classList.remove('visible');

    list.innerHTML = '<h2 style="font-size:18px;font-weight:600;margin-bottom:var(--spacing-lg);">課程列表</h2>' +
      '<div class="lesson-list">' +
      COURSE.weeks.map(w => {
        const done = this.state.done.includes(w.id);
        const score = this.state.scores[w.id];
        const status = done ? '✅' : (score !== undefined ? '📝' : '🔒');
        return `<div class="lesson-card${done ? ' completed' : ''}" onclick="App.openLesson(${w.id})">
          <div class="badge">${String(w.id).padStart(2,'0')}</div>
          <div class="info">
            <h3>第 ${w.id} 週：${w.title}</h3>
            <p>${w.topics}</p>
          </div>
          <div class="status-icon">${status}</div>
        </div>`;
      }).join('') +
      '</div>';
  },

  renderLessonDetail(id) {
    const w = COURSE.weeks.find(x => x.id === id);
    if (!w) return;
    const list = document.getElementById('lessonList');
    const detail = document.getElementById('lessonDetail');
    list.style.display = 'none';
    detail.classList.add('active');

    let html = `<div style="margin-bottom:var(--spacing-lg);">
      <p style="font-size:12px;color:var(--on-dark-muted);text-transform:uppercase;letter-spacing:0.2px;">第 ${id} 週</p>
      <h2 style="font-size:22px;font-weight:600;margin-top:var(--spacing-xs);">${w.title}</h2>
    </div>`;

    if (w.intro) {
      html += `<p class="intro-text">${w.intro}</p>`;
    }

    if (w.kana && w.kana.length) {
      html += `<div class="section-title">🔊 假名表（點擊聽發音）</div>
        <div class="kana-grid">`;
      w.kana.forEach(k => {
        html += `<div class="kana-cell" onclick="App.speak('${k.char}')">
          <span class="char">${k.char}</span>
          <span class="rom">${k.rom}</span>
        </div>`;
      });
      html += `</div>`;
    }

    if (w.vocab && w.vocab.length) {
      html += `<div class="section-title">📖 單字</div><div class="vocab-list">`;
      w.vocab.forEach(v => {
        html += `<div class="vocab-item">
          <span class="jp">${v.jp}</span>
          <span class="romaji">${v.rom}</span>
          <span class="zh">${v.zh}</span>
          <button class="sound-btn" onclick="event.stopPropagation();App.speak('${v.jp}')">▶</button>
        </div>`;
      });
      html += `</div>`;
    }

    if (w.grammar && w.grammar.length) {
      html += `<div class="section-title">📚 文法</div>`;
      w.grammar.forEach((g, gi) => {
        let voiceBtns = '';
        if (g.voice) {
          const items = Array.isArray(g.voice) ? g.voice : [g.voice];
          voiceBtns = `<div class="grammar-voice">` +
            items.map((v, vi) => {
              const label = typeof v === 'string' ? v : v.label;
              const pitch = typeof v === 'object' && v.pitch ? ` <span class="pitch-tag">${v.pitch}</span>` : '';
              return `<button class="voice-btn" data-w="${w.id}" data-g="${gi}" data-vi="${vi}">🔊 ${label}${pitch}</button>`;
            }).join('') +
            `</div>`;
        }
        html += `<div class="grammar-item">
          <div class="pattern">${g.pattern}</div>
          <div class="explain">${g.explain}</div>
          <div class="example">${g.example}</div>
          ${voiceBtns}
        </div>`;
      });
    }

    const hasQuiz = w.quiz && w.quiz.length;
    if (hasQuiz) {
      const done = this.state.done.includes(id);
      const score = this.state.scores[id];
      html += `<div style="margin-top:var(--spacing-xl);text-align:center;">
        <button class="quiz-submit" onclick="App.startQuiz(${id})" style="display:inline-block;width:auto;padding:var(--spacing-md) var(--spacing-xxl);">
          ${done ? '📝 重新測驗' : '✍️ 開始測驗'}
        </button>
        ${score !== undefined ? `<p style="margin-top:var(--spacing-sm);color:var(--on-dark-muted);font-size:13px;">上次成績：${score} 分</p>` : ''}
      </div>`;
    }

    // Mark as done button
    if (!this.state.done.includes(id)) {
      html += `<div style="margin-top:var(--spacing-lg);text-align:center;">
        <button class="quiz-submit" onclick="App.markDone(${id})" style="display:inline-block;width:auto;padding:var(--spacing-md) var(--spacing-xxl);background:var(--accent-violet-mid);">
          ✅ 標記為已完成
        </button>
      </div>`;
    }

    detail.innerHTML = html;

    detail.querySelectorAll('.voice-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const w = COURSE.weeks.find(x => x.id === Number(btn.dataset.w));
        if (!w) return;
        const g = w.grammar[Number(btn.dataset.g)];
        if (!g) return;
        const items = Array.isArray(g.voice) ? g.voice : [g.voice];
        const item = items[Number(btn.dataset.vi)];
        if (typeof item === 'object' && item.file) {
          const audioEl = document.getElementById('audioPlayer');
          if (audioEl) { audioEl.src = item.file; audioEl.play(); }
        } else {
          const text = item.replace(/[（）].*$/g, '').trim();
          this.speak(text);
        }
      });
    });
  },

  markDone(id) {
    if (!this.state.done.includes(id)) {
      this.state.done.push(id);
      this.save();
      this.renderLessonDetail(id);
    }
  },

  /* ─── quiz ─── */
  startQuiz(id) {
    this.state.quizWeek = id;
    this.state.quizSubmitted = false;
    this._answers = {};
    document.getElementById('backBtn').classList.add('visible');
    this.switchTab('quiz');
  },

  renderQuiz() {
    const container = document.getElementById('quizContent');
    const id = this.state.quizWeek;
    if (!id) {
      container.innerHTML = `<div class="empty-state">
        <span class="icon">📝</span>
        <p>請先從課程中選擇一課<br>點擊「開始測驗」按鈕</p>
      </div>
      <div style="text-align:center;padding:var(--spacing-lg) 0;">
        <div style="border-top:1px solid var(--hairline-violet);padding-top:var(--spacing-xl);margin:0 var(--spacing-xl);"></div>
        <p style="color:var(--on-dark-muted);font-size:13px;margin-bottom:var(--spacing-lg);">或使用閃卡練習 50 音</p>
        <button class="quiz-submit" onclick="App.openFlashcard()" style="display:inline-block;width:auto;padding:var(--spacing-md) var(--spacing-xxl);background:var(--accent-violet-deep);">
          🃏 50 音閃卡
        </button>
        <p style="color:var(--on-dark-muted);font-size:12px;margin-top:var(--spacing-sm);">已熟悉 ${this.state.flashcardKnown.length} / ${FLASH_KANA.length * 2} 個</p>
      </div>`;
      return;
    }
    const w = COURSE.weeks.find(x => x.id === id);
    if (!w || !w.quiz || !w.quiz.length) {
      container.innerHTML = `<div class="empty-state"><span class="icon">❌</span><p>此課尚無測驗</p></div>`;
      return;
    }

    const done = this.state.done.includes(id);
    const prevScore = this.state.scores[id];

    let html = `<div class="quiz-header">
      <h2>第 ${id} 週測驗：${w.title}</h2>
      <p class="quiz-meta">共 ${w.quiz.length} 題 · 點擊選項作答 · 完成後按提交</p>
      ${prevScore !== undefined ? `<p style="color:var(--accent-lime);font-size:13px;margin-top:var(--spacing-xs);">上次成績：${prevScore}/100</p>` : ''}
    </div>`;

    w.quiz.forEach((q, i) => {
      html += `<div class="quiz-question" data-q="${i}">
        <div class="q-num">問題 ${i + 1} / ${w.quiz.length}</div>
        <div class="q-text">${q.q}</div>
        <div class="quiz-options" data-q="${i}">`;
      q.opts.forEach((o, j) => {
        html += `<button class="quiz-option" data-q="${i}" data-opt="${j}" onclick="App.selectAnswer(${i}, ${j})">
          <span class="opt-label">${String.fromCharCode(65 + j)}</span> ${o}
        </button>`;
      });
      html += `</div></div>`;
    });

    html += `<button class="quiz-submit" id="quizSubmitBtn" onclick="App.submitQuiz()" disabled>提交答案</button>`;

    container.innerHTML = html;
  },

  selectAnswer(qIdx, optIdx) {
    if (this.state.quizSubmitted) return;
    const container = document.querySelector(`.quiz-options[data-q="${qIdx}"]`);
    container.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
    container.querySelector(`[data-opt="${optIdx}"]`).classList.add('selected');

    // Track selected
    if (!this._answers) this._answers = {};
    this._answers[qIdx] = optIdx;

    // Enable submit if all answered
    const w = COURSE.weeks.find(x => x.id === this.state.quizWeek);
    const total = w.quiz.length;
    const answered = Object.keys(this._answers).length;
    document.getElementById('quizSubmitBtn').disabled = answered < total;
  },

  submitQuiz() {
    if (this.state.quizSubmitted) return;
    const w = COURSE.weeks.find(x => x.id === this.state.quizWeek);
    if (!w) return;
    this.state.quizSubmitted = true;

    let correct = 0;
    w.quiz.forEach((q, i) => {
      const selected = this._answers[i];
      const opts = document.querySelectorAll(`.quiz-options[data-q="${i}"] .quiz-option`);
      opts.forEach((b, j) => {
        b.disabled = true;
        if (j === q.ans) b.classList.add('correct');
        if (j === selected && j !== q.ans) b.classList.add('wrong');
      });
      if (selected === q.ans) correct++;
    });

    const pct = Math.round((correct / w.quiz.length) * 100);
    this.state.scores[w.id] = pct;

    let msg = '';
    if (pct === 100) msg = '完美！全部答對了！🎉';
    else if (pct >= 80) msg = '非常好！繼續保持！👏';
    else if (pct >= 60) msg = '不錯，再加強一下！💪';
    else msg = '加油，多複習幾次！📖';

    const container = document.getElementById('quizContent');
    container.insertAdjacentHTML('beforeend', `<div class="quiz-result">
      <div class="score">${correct}/${w.quiz.length}</div>
      <div class="score-label">正確題數</div>
      <div class="msg">${msg}</div>
    </div>`);

    document.getElementById('quizSubmitBtn').disabled = true;
    document.getElementById('quizSubmitBtn').textContent = '已提交';

    // Auto mark done if passed
    if (pct >= 60 && !this.state.done.includes(w.id)) {
      this.state.done.push(w.id);
    }
    this.save();
  },

  /* ─── home stats ─── */
  updateHomeStats() {
    const total = COURSE.weeks.length;
    const done = this.state.done.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    document.getElementById('ringPct').textContent = pct + '%';
    const circle = document.getElementById('ringFg');
    const circumference = 314.16;
    circle.style.strokeDashoffset = circumference - (pct / 100) * circumference;

    document.getElementById('statLessons').textContent = done + '/' + total;
    const quizCount = Object.keys(this.state.scores).length;
    document.getElementById('statQuizzes').textContent = quizCount;

    const scores = Object.values(this.state.scores);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '-';
    document.getElementById('statAvg').textContent = avg;
  },

  /* ─── progress ─── */
  renderProgress() {
    const container = document.getElementById('progressContent');
    const total = COURSE.weeks.length;
    const done = this.state.done.length;
    const scores = Object.values(this.state.scores);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    let html = `<h2 style="font-size:18px;font-weight:600;margin-bottom:var(--spacing-lg);">學習進度</h2>
      <div class="progress-grid">
        <div class="progress-card"><div class="big">${done}/${total}</div><div class="lbl">已完成課程</div></div>
        <div class="progress-card"><div class="big">${scores.length}</div><div class="lbl">測驗次數</div></div>
        <div class="progress-card"><div class="big">${avg}分</div><div class="lbl">平均分數</div></div>
        <div class="progress-card"><div class="big">${Math.round((done/total)*100)}%</div><div class="lbl">總完成率</div></div>
      </div>
      <div class="section-title" style="margin-top:0;">各課進度</div>
      <div class="progress-detail">`;

    COURSE.weeks.forEach(w => {
      const d = this.state.done.includes(w.id);
      const s = this.state.scores[w.id];
      const bar = s !== undefined ? s : (d ? 100 : 0);
      const status = d ? '✅' : (s !== undefined ? '📝' : '⭕');
      html += `<div class="progress-row">
        <span class="p-status">${status}</span>
        <span class="p-name">第${w.id}課</span>
        <div class="p-bar"><div class="fill" style="width:${bar}%"></div></div>
        <span class="p-score">${s !== undefined ? s + '分' : (d ? '✓' : '-')}</span>
      </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  /* ─── quiz tracking ─── */
  _answers: {}
};

document.addEventListener('DOMContentLoaded', () => App.init());
