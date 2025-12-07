/**
 * Quiz Common JavaScript
 * Shared functionality for all quiz applications
 *
 * Required global variables from each quiz:
 * - quizData: Array of quiz items
 * - quizConfig: Configuration object { title, description }
 */

// Quiz Engine Class
class QuizEngine {
  constructor(quizData, config = {}) {
    this.quizData = quizData;
    this.config = config;
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = {};

    this.initializeDOM();
    this.attachEventListeners();
  }

  initializeDOM() {
    this.configSection = document.getElementById('config');
    this.quizWrapper = document.getElementById('quizWrapper');
    this.resultsWrapper = document.getElementById('resultsWrapper');
    this.quizContainer = document.getElementById('quizContainer');
    this.startBtn = document.getElementById('startBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.exitBtn = document.getElementById('exitBtn');
    this.currentQEl = document.getElementById('currentQ');
    this.totalQEl = document.getElementById('totalQ');
    this.progressFill = document.getElementById('progressFill');
    this.modeSelect = document.getElementById('mode');
    this.countInput = document.getElementById('count');
    this.scopeSelect = document.getElementById('scope');

    // Results elements
    this.scoreNumber = document.getElementById('scoreNumber');
    this.scorePercent = document.getElementById('scorePercent');
    this.wrongList = document.getElementById('wrongList');
    this.allList = document.getElementById('allList');
    this.wrongSection = document.getElementById('wrongSection');
    this.allSection = document.getElementById('allSection');
    this.restartBtn = document.getElementById('restartBtn');
    this.newQuizBtn = document.getElementById('newQuizBtn');
    this.reviewWrongBtn = document.getElementById('reviewWrongBtn');
    this.reviewAllBtn = document.getElementById('reviewAllBtn');

    // Modal elements
    this.confirmModal = document.getElementById('confirmModal');
    this.modalMessage = document.getElementById('modalMessage');
    this.modalCancel = document.getElementById('modalCancel');
    this.modalConfirm = document.getElementById('modalConfirm');
  }

  attachEventListeners() {
    this.startBtn.addEventListener('click', () => this.startQuiz());
    this.nextBtn.addEventListener('click', () => this.nextQuestion());
    this.exitBtn.addEventListener('click', () => this.showExitConfirmation());
    this.modalCancel.addEventListener('click', () => this.hideModal());
    this.modalConfirm.addEventListener('click', () => {
      this.hideModal();
      this.showResults();
    });

    this.restartBtn.addEventListener('click', () => this.startQuiz());
    this.newQuizBtn.addEventListener('click', () => this.newQuiz());
    this.reviewWrongBtn.addEventListener('click', () => this.reviewWrongAnswers());
    this.reviewAllBtn.addEventListener('click', () => this.showAllAnswers());

    // Keyboard support
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  handleKeyboard(e) {
    if (this.quizWrapper.classList.contains('hidden')) return;
    if (!this.confirmModal.classList.contains('hidden')) return;

    const currentSlide = document.querySelector('.question-slide.active');
    if (!currentSlide) return;

    const q = this.questions[this.currentQuestionIndex];

    // Enter key - next question
    if (e.key === 'Enter') {
      e.preventDefault();
      this.nextQuestion();
      return;
    }

    // Number keys 1-4 for multiple choice
    if (q.mode === "multiple" && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      const opts = currentSlide.querySelectorAll('.opt');
      if (opts[index]) {
        opts.forEach(o => o.classList.remove('selected'));
        opts[index].classList.add('selected');
        this.userAnswers[q.id] = opts[index].dataset.value;
      }
    }
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  buildQuestions() {
    const scope = this.scopeSelect.value;
    let pool = this.quizData.filter(x => {
      if (scope === "bounds") return x.kind === "boundary";
      if (scope === "periods" || scope === "starts" || scope === "ends") {
        return x.kind === "period";
      }
      return true;
    });

    const count = Math.min(Math.max(parseInt(this.countInput.value || 12, 10), 5), 50);
    const mode = this.modeSelect.value;

    this.questions = [];
    const focus = scope === "periods" ? "dur" :
                  scope === "starts" ? "start" :
                  scope === "ends" ? "end" :
                  scope === "bounds" ? "boundary" : "mixed";

    pool = this.shuffle(pool);
    for (let i = 0; i < count; i++) {
      const q = this.makeQuestion(pool[i % pool.length], mode, focus);
      this.questions.push(q);
    }
  }

  makeQuestion(item, mode, focus) {
    // This method should be overridden by each quiz
    // Default implementation for reference
    throw new Error('makeQuestion must be implemented by the specific quiz');
  }

  startQuiz() {
    this.buildQuestions();
    this.currentQuestionIndex = 0;
    this.userAnswers = {};

    this.configSection.classList.add('hidden');
    this.quizWrapper.classList.remove('hidden');
    this.resultsWrapper.classList.add('hidden');

    this.totalQEl.textContent = this.questions.length;
    this.renderAllQuestions();
    this.showQuestion(0);
  }

  renderAllQuestions() {
    this.quizContainer.innerHTML = '';
    this.questions.forEach((q, idx) => {
      const slide = this.createQuestionSlide(q, idx);
      this.quizContainer.appendChild(slide);
    });
  }

  createQuestionSlide(q, idx) {
    const slide = document.createElement('div');
    slide.className = 'question-slide';
    slide.dataset.index = idx;

    const typeLabel = q.type === "dur" ? '期間' :
                     q.type === "start" ? '開始' :
                     q.type === "end" ? '終了' : '境界';

    let choicesHTML = '';
    if (q.mode === "multiple") {
      choicesHTML = `
        <div class="options">
          ${q.choices.map((c, i) => `
            <div class="opt" data-value="${c}" data-key="${i + 1}">
              ${c}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      choicesHTML = `
        <div class="answer-input">
          <label>回答を入力してください</label>
          <input type="text" class="answer-text" placeholder="${q.placeholder || '回答を入力'}" />
        </div>
      `;
    }

    slide.innerHTML = `
      <div class="question-content">
        <div class="question-header">
          <div class="question-text">${q.prompt}</div>
          <div class="question-badges">
            ${q.badges ? q.badges.map(b => `<span class="badge">${b}</span>`).join('') : ''}
          </div>
        </div>
        ${choicesHTML}
        ${q.hint ? `<div class="hint">💡 ${q.hint}</div>` : ''}
      </div>
    `;

    // Add event listeners
    if (q.mode === "multiple") {
      const opts = slide.querySelectorAll('.opt');
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          opts.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          this.userAnswers[q.id] = opt.dataset.value;
        });
      });
    } else {
      const input = slide.querySelector('.answer-text');
      input.addEventListener('input', () => {
        this.userAnswers[q.id] = input.value.trim();
      });
    }

    return slide;
  }

  showQuestion(index) {
    const slides = document.querySelectorAll('.question-slide');
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev');
      if (i < index) {
        slide.classList.add('prev');
      } else if (i === index) {
        slide.classList.add('active');
      }
    });

    this.currentQuestionIndex = index;
    this.currentQEl.textContent = index + 1;
    this.progressFill.style.width = `${((index + 1) / this.questions.length) * 100}%`;

    // Update next button text
    if (index === this.questions.length - 1) {
      this.nextBtn.textContent = '結果を表示';
    } else {
      this.nextBtn.textContent = '次へ';
    }

    // Restore previous answer if exists
    const q = this.questions[index];
    const slide = slides[index];

    if (this.userAnswers[q.id]) {
      if (q.mode === "multiple") {
        const opts = slide.querySelectorAll('.opt');
        opts.forEach(opt => {
          if (opt.dataset.value === this.userAnswers[q.id]) {
            opt.classList.add('selected');
          }
        });
      } else {
        const input = slide.querySelector('.answer-text');
        input.value = this.userAnswers[q.id];
      }
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.showQuestion(this.currentQuestionIndex + 1);
    } else {
      this.showResults();
    }
  }

  showExitConfirmation() {
    this.confirmModal.classList.remove('hidden');
    this.modalMessage.textContent = '本当に終了して結果を見ますか？未回答の問題は不正解として扱われます。';
  }

  hideModal() {
    this.confirmModal.classList.add('hidden');
  }

  compareAnswer(userAnswer, correctAnswer) {
    // This method should be overridden by each quiz for custom comparison logic
    return userAnswer === correctAnswer;
  }

  showResults() {
    this.quizWrapper.classList.add('hidden');
    this.resultsWrapper.classList.remove('hidden');

    // Calculate score
    let correct = 0;

    const results = this.questions.map(q => {
      const userAnswer = this.userAnswers[q.id];
      let isCorrect = false;
      let status = 'unanswered';

      if (userAnswer) {
        isCorrect = this.compareAnswer(userAnswer, q.correct);
        status = isCorrect ? 'correct' : 'incorrect';
        if (isCorrect) correct++;
      }

      return {
        question: q,
        userAnswer: userAnswer || '未回答',
        correctAnswer: q.correct,
        isCorrect,
        status
      };
    });

    // Update score display
    this.scoreNumber.textContent = `${correct} / ${this.questions.length}`;
    const percent = Math.round((correct / this.questions.length) * 100);
    this.scorePercent.textContent = `正解率: ${percent}%`;

    // Display wrong answers
    const wrongAnswers = results.filter(r => r.status !== 'correct');
    if (wrongAnswers.length > 0) {
      this.wrongSection.classList.remove('hidden');
      this.wrongList.innerHTML = wrongAnswers.map(r => `
        <div class="result-item ${r.status}">
          <div class="result-question">Q${results.indexOf(r) + 1}: ${r.question.prompt}</div>
          <div class="result-answer">
            <div class="result-answer-line your-answer">
              あなたの回答: ${r.userAnswer}
            </div>
            <div class="result-answer-line correct-answer">
              正解: ${r.correctAnswer}
            </div>
          </div>
        </div>
      `).join('');
    } else {
      this.wrongSection.classList.add('hidden');
    }

    // Enable/disable review button
    this.reviewWrongBtn.disabled = wrongAnswers.length === 0;
  }

  showAllAnswers() {
    this.allSection.classList.remove('hidden');

    const results = this.questions.map((q, idx) => {
      const userAnswer = this.userAnswers[q.id];
      let isCorrect = false;
      let status = 'unanswered';

      if (userAnswer) {
        isCorrect = this.compareAnswer(userAnswer, q.correct);
        status = isCorrect ? 'correct' : 'incorrect';
      }

      return {
        question: q,
        userAnswer: userAnswer || '未回答',
        correctAnswer: q.correct,
        isCorrect,
        status
      };
    });

    this.allList.innerHTML = results.map((r, idx) => `
      <div class="result-item ${r.status}">
        <div class="result-question">Q${idx + 1}: ${r.question.prompt}</div>
        <div class="result-answer">
          <div class="result-answer-line your-answer">
            あなたの回答: ${r.userAnswer}
          </div>
          <div class="result-answer-line correct-answer">
            正解: ${r.correctAnswer}
          </div>
        </div>
      </div>
    `).join('');

    // Scroll to all answers section
    this.allSection.scrollIntoView({ behavior: 'smooth' });
  }

  reviewWrongAnswers() {
    const wrongItems = this.questions.filter(q => {
      const userAnswer = this.userAnswers[q.id];
      if (!userAnswer) return true;
      return !this.compareAnswer(userAnswer, q.correct);
    }).map(q => q.item);

    if (wrongItems.length === 0) return;

    const mode = this.modeSelect.value;
    const scope = this.scopeSelect.value;
    const focus = scope === "periods" ? "dur" :
                  scope === "starts" ? "start" :
                  scope === "ends" ? "end" :
                  scope === "bounds" ? "boundary" : "mixed";

    this.questions = [];
    wrongItems.forEach(it => this.questions.push(this.makeQuestion(it, mode, focus)));

    this.currentQuestionIndex = 0;
    this.userAnswers = {};

    this.resultsWrapper.classList.add('hidden');
    this.quizWrapper.classList.remove('hidden');

    this.totalQEl.textContent = this.questions.length;
    this.renderAllQuestions();
    this.showQuestion(0);
  }

  newQuiz() {
    this.resultsWrapper.classList.add('hidden');
    this.configSection.classList.remove('hidden');
  }
}

// Utility Functions
const QuizUtils = {
  // Format number to Japanese notation (override for each quiz if needed)
  formatNumber(num) {
    return num.toString();
  },

  // Normalize user input (override for each quiz if needed)
  normalize(str) {
    return str.trim().toLowerCase();
  },

  // Extract numeric value from string (override for each quiz if needed)
  extractNumber(str) {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
};
