document.addEventListener('DOMContentLoaded', () => {
  // Initialize gamification system
  const gamification = new GamificationSystem();

  // ===== BUTTON HOVER EFFECTS =====
  const buttons = document.querySelectorAll('.pill-button, .nav-links a');
  buttons.forEach((button) => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
    });
  });

  const supportCard = document.getElementById('support-card');
  const supportModal = document.getElementById('support-options-modal');
  const supportBackdrop = document.getElementById('support-options-backdrop');
  const supportClose = document.getElementById('support-options-close');

  function openSupportModal() {
    if (supportModal) {
      supportModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeSupportModal() {
    if (supportModal) {
      supportModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  if (supportCard) {
    supportCard.addEventListener('click', openSupportModal);
    supportCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSupportModal();
      }
    });
  }

  if (supportBackdrop) {
    supportBackdrop.addEventListener('click', closeSupportModal);
  }

  if (supportClose) {
    supportClose.addEventListener('click', closeSupportModal);
  }

  const openChatAssistantBtn = document.getElementById('open-chat-assistant-btn');

  if (openChatAssistantBtn) {
    openChatAssistantBtn.addEventListener('click', (event) => {
      event.preventDefault();
      closeSupportModal();

      const chatLauncher = document.querySelector('.bpw-widget-btn, .bpw-widget-button, [data-testid="webchat-open-button"]');
      if (chatLauncher) {
        chatLauncher.click();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && supportModal && !supportModal.classList.contains('hidden')) {
      closeSupportModal();
    }
  });

  // ===== DOM ELEMENTS =====
  // Goal elements
  const goalInput = document.getElementById('goal-input');
  const addGoalBtn = document.getElementById('add-goal-btn');
  const goalsList = document.getElementById('goals-list');
  const goalsStatus = document.getElementById('goals-status');
  const goalCompletionCount = document.getElementById('goal-completion-count');

  // Quiz elements
  const quizTopic = document.getElementById('quiz-topic');
  const quizDifficulty = document.getElementById('quiz-difficulty');
  const quizGenerateBtn = document.getElementById('quiz-generate-btn');
  const loading = document.getElementById('loading');
  const quizModal = document.getElementById('quiz-modal');
  const quizBackdrop = document.getElementById('quiz-modal-backdrop');
  const quizClose = document.getElementById('quiz-modal-close');
  const quizTitle = document.getElementById('quiz-modal-title');
  const quizDescription = document.getElementById('quiz-modal-description');
  const quizQuestionList = document.getElementById('quiz-question-list');
  const resultPanel = document.getElementById('quiz-result-panel');
  const quizScoreText = document.getElementById('quiz-score-text');
  const quizXPEarned = document.getElementById('quiz-xp-earned');
  const quizBadgeMessage = document.getElementById('quiz-badge-message');
  const finishQuizBtn = document.getElementById('finish-quiz-btn');
  const closeResultBtn = document.getElementById('close-result-btn');

  // Progress elements
  const progressRing = document.getElementById('progress-ring');
  const progressValue = document.getElementById('progress-value');
  const currentLevel = document.getElementById('current-level');
  const xpPoints = document.getElementById('xp-points');
  const xpNeeded = document.getElementById('xp-needed');
  const badgeCount = document.getElementById('badge-count');
  const activityCount = document.getElementById('activity-count');
  const completedGoalsCount = document.getElementById('completed-goals');
  const quizzesTakenCount = document.getElementById('quizzes-taken');
  const nextBadgeChip = document.getElementById('next-badge-chip');
  const milestoneMessage = document.getElementById('milestone-message');

  // Badge milestone elements
  const badge100 = document.getElementById('badge-100');
  const badge250 = document.getElementById('badge-250');
  const badge500 = document.getElementById('badge-500');
  const badge1000 = document.getElementById('badge-1000');

  // Internal variable to track if current quiz was already scored and captured
  let isQuizSubmitted = false;

  // ===== PROGRESS RING ANIMATION =====
  function setRingValue(value) {
    const progress = Math.min(Math.max(value, 0), 100);
    progressValue.textContent = `${progress}%`;
    progressRing.style.background = `conic-gradient(var(--primary) ${progress}%, #e7edff ${progress}% 100%)`;
  }

  function animateProgress(target = 0) {
    let start = null;
    const duration = 1000;

    function step(timestamp) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      setRingValue(Math.round(progress * target));
      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ===== UPDATE DISPLAY =====
  function updateProgressDisplay() {
    const level = gamification.getLevel();
    const totalXP = gamification.getTotalXP();
    const xpProgress = gamification.getXPProgress();
    const badgeInfo = gamification.getBadgeInfo();
    const completedGoals = gamification.getCompletedGoals();
    const actCount = gamification.getActivityCount();

    if (currentLevel) currentLevel.textContent = `Level ${level}`;
    if (xpPoints) xpPoints.textContent = totalXP;
    if (xpNeeded) xpNeeded.textContent = xpProgress.needed;
    if (badgeCount) badgeCount.textContent = badgeInfo.unlocked.length;
    if (activityCount) activityCount.textContent = actCount;
    if (completedGoalsCount) completedGoalsCount.textContent = completedGoals.length;
    if (quizzesTakenCount) quizzesTakenCount.textContent = gamification.data.quizzesTaken || 0;

    if (progressRing) {
      animateProgress(xpProgress.percentage);
    }

    const nextBadge = badgeInfo.nextBadge;
    if (nextBadgeChip) {
      if (nextBadge) {
        nextBadgeChip.innerHTML = `<strong>${nextBadge}</strong> XP to unlock badge`;
      } else {
        nextBadgeChip.innerHTML = `<strong>Max</strong> badges unlocked!`;
      }
    }

    updateBadgeMilestones(badgeInfo);

    if (milestoneMessage) {
      if (totalXP === 0) {
        milestoneMessage.textContent = 'Complete study goals and quizzes to earn XP and unlock badges!';
      } else if (nextBadge === 100) {
        milestoneMessage.textContent = `Keep going! ${100 - totalXP} XP to first badge.`;
      } else if (nextBadge === 250) {
        milestoneMessage.textContent = `Excellent progress! ${nextBadge - totalXP} XP to next badge.`;
      } else if (nextBadge === 500) {
        milestoneMessage.textContent = `Amazing dedication! ${nextBadge - totalXP} XP to final badge.`;
      } else {
        milestoneMessage.textContent = 'Congratulations! You have unlocked all badges!';
      }
    }
  }

  function updateBadgeMilestones(badgeInfo) {
    const badges = [
      { element: badge100, threshold: 100, icon: '🎯' },
      { element: badge250, threshold: 250, icon: '⭐' },
      { element: badge500, threshold: 500, icon: '👑' },
      { element: badge1000, threshold: 1000, icon: '🏆' }
    ];

    badges.forEach((badge, index) => {
      if (!badge.element) return;

      if (badgeInfo.unlocked.includes(index)) {
        badge.element.style.opacity = '1';
        badge.element.innerHTML = `${badge.icon} ${badge.threshold} XP (Unlocked!)`;
        badge.element.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
        badge.element.style.color = 'white';
      } else {
        badge.element.style.opacity = '0.6';
        badge.element.innerHTML = `${badge.icon} ${badge.threshold} XP`;
        badge.element.style.background = 'linear-gradient(135deg, var(--mint), #f7fefb)';
        badge.element.style.color = 'inherit';
      }
    });
  }

  // ===== GOALS MANAGEMENT =====
  function renderGoals() {
    if (!goalsList || !goalsStatus || !goalCompletionCount) return;

    const goals = gamification.getGoals();
    
    if (goals.length === 0) {
      goalsList.innerHTML = '<li class="empty-state">No goals yet. Add one to start earning XP!</li>';
      goalsStatus.textContent = 'No goals yet';
      goalCompletionCount.textContent = '0';
      return;
    }

    const completed = gamification.getCompletedGoals().length;
    goalsStatus.textContent = `${completed}/${goals.length} completed`;
    goalCompletionCount.textContent = completed;

    goalsList.innerHTML = goals
      .map((goal) => `
        <li class="goal-item ${goal.completed ? 'completed' : 'pending'}">
          <div class="goal-content">
            <input type="checkbox" class="goal-checkbox" data-goal-id="${goal.id}" ${goal.completed ? 'checked' : ''} />
            <span class="goal-text">${goal.text}</span>
            <span class="goal-xp">+${gamification.GOAL_XP || 10} XP</span>
          </div>
          <button class="goal-delete" data-goal-id="${goal.id}" aria-label="Delete goal">×</button>
        </li>
      `)
      .join('');

    // Attach event listeners
    document.querySelectorAll('.goal-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        const goalId = Number(e.target.dataset.goalId);
        if (e.target.checked) {
          const result = gamification.completeGoal(goalId);
          if (result) {
            showNotification(`Goal completed! +${result.xpEarned} XP`);
            if (result.newBadges && result.newBadges.length > 0) {
              result.newBadges.forEach(badge => {
                showNotification(`🎉 Badge unlocked at ${badge.threshold} XP!`);
              });
            }
            updateProgressDisplay();
            renderGoals();
          }
        }
      });
    });

    document.querySelectorAll('.goal-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const goalId = Number(e.target.dataset.goalId);
        gamification.removeGoal(goalId);
        renderGoals();
        updateProgressDisplay();
      });
    });
  }

  if (addGoalBtn && goalInput) {
    addGoalBtn.addEventListener('click', () => {
      const goalText = goalInput.value.trim();
      if (goalText) {
        gamification.addGoal(goalText);
        goalInput.value = '';
        goalInput.focus();
        renderGoals();
      }
    });

    goalInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addGoalBtn.click();
      }
    });
  }

  // ===== QUIZ MANAGEMENT =====
  function showQuizModal() {
    if (quizModal) {
      quizModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  }

  function hideQuizModal() {
    if (quizModal) {
      quizModal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  function displayQuiz(questions) {
    const safeQuestions = Array.isArray(questions) ? questions : [];

    if (safeQuestions.length === 0) {
      alert("The quiz generator returned no questions.");
      return;
    }

    if (quizTitle) quizTitle.textContent = "Your Gemini AI Quiz";
    if (quizDescription) quizDescription.textContent = `${safeQuestions.length} AI-generated questions`;
    
    quizQuestionList.innerHTML = "";
    isQuizSubmitted = false;

    safeQuestions.forEach((q, index) => {
      let html = `
        <li data-answer="${q.answer}">
          <strong class="quiz-question-text">${index + 1}. ${q.question}</strong>
          <div class="options-container" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
      `;

      q.options.forEach(option => {
        html += `
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input
              type="radio"
              name="question-${index}"
              value="${option}">
            <span>${option}</span>
          </label>
        `;
      });

      html += `</div></li>`;
      quizQuestionList.innerHTML += html;
    });

    if (resultPanel) resultPanel.classList.add("hidden");
    if (closeResultBtn) closeResultBtn.classList.add("hidden");
    if (finishQuizBtn) finishQuizBtn.textContent = "Submit Answers";
    showQuizModal();
  }

  async function generateAIQuiz() {
    const subject = quizTopic.value;
    const difficulty = quizDifficulty.value;
    const count = document.getElementById("quiz-count").value;
    const type = document.getElementById("quiz-type").value;

    if (!subject) {
      alert("Please select a module.");
      return;
    }

    quizGenerateBtn.disabled = true;
    quizGenerateBtn.textContent = "Generating Quiz...";
    if (loading) loading.classList.remove('hidden');

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject,
          difficulty,
          count,
          type
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate quiz.");
      }

      if (!Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error("The quiz generator returned an empty set of questions.");
      }

      displayQuiz(data.quiz);

    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to connect to backend server. Ensure node app and your API keys are working.");
    } finally {
      quizGenerateBtn.disabled = false;
      quizGenerateBtn.textContent = "🚀 Generate AI Quiz";
      if (loading) loading.classList.add('hidden');
    }
  }

  function updateQuizResult() {
    if (isQuizSubmitted) {
      hideQuizModal();
      return;
    }

    const questionItems = Array.from(quizQuestionList.querySelectorAll('li'));
    if (questionItems.length === 0) return;

    let score = 0;

    questionItems.forEach((item) => {
      const selected = item.querySelector('input[type="radio"]:checked');
      const correctAnswer = item.dataset.answer;

      const labels = item.querySelectorAll('label');
      labels.forEach(lbl => {
        const rad = lbl.querySelector('input');
        if (rad.value === correctAnswer) {
          lbl.style.color = "#155724";
          lbl.style.fontWeight = "bold";
        }
        if (rad.checked && rad.value !== correctAnswer) {
          lbl.style.color = "#721c24";
        }
      });

      if (selected && selected.value === correctAnswer) {
        score += 1;
      }
    });

    const total = questionItems.length;
    const percentage = total ? Math.round((score / total) * 100) : 0;
    const xpReward = score * 10;

    if (xpReward > 0) {
      gamification.data.totalXP = (gamification.data.totalXP || 0) + xpReward;
      showNotification(`Quiz Completed! +${xpReward} XP awarded!`);
    }
    gamification.data.quizzesTaken = (gamification.data.quizzesTaken || 0) + 1;
    
    if (typeof gamification.saveData === 'function') {
      gamification.saveData();
    }
    updateProgressDisplay();

    if (quizScoreText) quizScoreText.textContent = `Score: ${score}/${total} (${percentage}%)`;
    if (quizXPEarned) quizXPEarned.textContent = `XP Earned: +${xpReward} XP`;
    if (quizBadgeMessage) {
      quizBadgeMessage.textContent = percentage === 100
        ? 'Perfect! Great job!'
        : percentage >= 70
          ? 'Nice work!'
          : 'Keep practicing!';
    }

    if (resultPanel) resultPanel.classList.remove('hidden');
    if (closeResultBtn) closeResultBtn.classList.remove('hidden');
    if (finishQuizBtn) finishQuizBtn.textContent = 'Close Window';
    isQuizSubmitted = true;
  }

  if (quizGenerateBtn) {
    quizGenerateBtn.addEventListener("click", generateAIQuiz);
  } else {
    console.error('quizGenerateBtn element is missing');
  }

  if (finishQuizBtn) finishQuizBtn.addEventListener("click", updateQuizResult);
  if (quizClose) quizClose.addEventListener("click", hideQuizModal);
  if (quizBackdrop) quizBackdrop.addEventListener("click", hideQuizModal);
  if (closeResultBtn) closeResultBtn.addEventListener("click", hideQuizModal);

  const cardModal = document.getElementById('card-click-modal');
  const cardBackdrop = document.getElementById('card-click-backdrop');
  const cardClose = document.getElementById('card-click-close');
  const cardSubtitle = document.getElementById('card-click-subtitle');
  const cardModalTitle = document.getElementById('card-click-modal-title');
  const cardModalContent = document.getElementById('card-click-modal-content');
  const studyStrategiesModal = document.getElementById('study-strategies-modal');
  const studyStrategiesBackdrop = document.getElementById('study-strategies-backdrop');
  const studyStrategiesClose = document.getElementById('study-strategies-close');

  function showCardModal(card) {
    if (card.dataset.cardType === 'revision-guide') {
      if (!studyStrategiesModal) return;

      studyStrategiesModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      return;
    }

    if (!cardModal) return;
    const title = card.dataset.cardTitle || card.querySelector('h3, h2, h1')?.textContent || 'More details';
    const subtitle = card.dataset.cardSubtitle || '';
    const content = card.dataset.cardContent || card.dataset.cardDescription || '';

    function getStudyDashboardSummary() {
      const fallback = {
        level: 1,
        xpEarned: 0,
        goalsCompleted: 0,
        quizzesCompleted: 0,
        badgeCount: 0,
        xpRemaining: 100
      };

      if (!gamification) return fallback;

      const level = typeof gamification.getLevel === 'function' ? gamification.getLevel() : fallback.level;
      const totalXP = typeof gamification.getTotalXP === 'function' ? gamification.getTotalXP() : fallback.xpEarned;
      const completedGoals = typeof gamification.getCompletedGoals === 'function' ? gamification.getCompletedGoals().length : fallback.goalsCompleted;
      const quizzesTaken = (gamification.data && typeof gamification.data.quizzesTaken === 'number') ? gamification.data.quizzesTaken : fallback.quizzesCompleted;
      const badgeInfo = typeof gamification.getBadgeInfo === 'function' ? gamification.getBadgeInfo() : { unlocked: [] };
      const badgeCount = Array.isArray(badgeInfo.unlocked) ? badgeInfo.unlocked.length : fallback.badgeCount;
      const nextBadgeThreshold = typeof badgeInfo.nextBadge === 'number' ? badgeInfo.nextBadge : 100;
      const xpRemaining = Math.max(nextBadgeThreshold - totalXP, 0);

      return {
        level,
        xpEarned: totalXP,
        goalsCompleted: completedGoals,
        quizzesCompleted: quizzesTaken,
        badgeCount,
        xpRemaining
      };
    }

    if (card.dataset.cardType === 'study-dashboard') {
      const summary = getStudyDashboardSummary();

      cardModalTitle.textContent = title;
      cardSubtitle.textContent = subtitle || 'A quick view of your current learning progress';
      cardModalContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-chip"><strong>Current Level</strong><br>${summary.level}</div>
          <div class="stat-chip"><strong>XP Earned</strong><br>${summary.xpEarned}</div>
          <div class="stat-chip"><strong>Goals Completed</strong><br>${summary.goalsCompleted}</div>
          <div class="stat-chip"><strong>Quizzes Completed</strong><br>${summary.quizzesCompleted}</div>
          <div class="stat-chip"><strong>Current Badge Count</strong><br>${summary.badgeCount}</div>
          <div class="stat-chip"><strong>XP Remaining Until Next Badge</strong><br>${summary.xpRemaining}</div>
        </div>
        <p class="milestone-message">Next Badge: ${summary.xpRemaining > 0 ? `${summary.xpRemaining} XP remaining` : 'Unlocked!'}</p>
      `;

      cardModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      return;
    }

    if (card.dataset.cardType === 'progress-tracker') {
      const level = typeof gamification.getLevel === 'function' ? gamification.getLevel() : 1;
      const totalXP = typeof gamification.getTotalXP === 'function' ? gamification.getTotalXP() : 0;
      const xpProgress = typeof gamification.getXPProgress === 'function' ? gamification.getXPProgress() : { current: 0, needed: 100 };
      const xpNeededForNextLevel = Math.max(xpProgress.needed - xpProgress.current, 0);
      const milestones = [
        { level: 1, threshold: 100, label: 'Earn 100 XP' },
        { level: 2, threshold: 250, label: 'Earn 250 XP' },
        { level: 3, threshold: 500, label: 'Earn 500 XP' },
        { level: 4, threshold: 1000, label: 'Earn 1000 XP and unlock AI Champion' }
      ];

      const roadmapItems = milestones.map((milestone) => {
        const completed = totalXP >= milestone.threshold;
        return `
          <div class="stat-chip">
            <strong>Level ${milestone.level}</strong>
            <span>${completed ? '✅' : '⬜'} ${milestone.label}</span>
          </div>
        `;
      }).join('');

      cardModalTitle.textContent = title;
      cardSubtitle.textContent = subtitle || 'Your current level and upcoming milestones';
      cardModalContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-chip"><strong>Current XP</strong><br>${totalXP}</div>
          <div class="stat-chip"><strong>XP Needed For Next Level</strong><br>${xpNeededForNextLevel}</div>
          <div class="stat-chip"><strong>Current Level</strong><br>${level}</div>
        </div>
        <div class="stats-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
          ${roadmapItems}
        </div>
      `;

      cardModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      return;
    }

    if (card.dataset.cardType === 'badge-milestones') {
      const totalXP = typeof gamification.getTotalXP === 'function' ? gamification.getTotalXP() : 0;
      const badgeInfo = typeof gamification.getBadgeInfo === 'function' ? gamification.getBadgeInfo() : { unlocked: [] };
      const unlocked = badgeInfo.unlocked || [];
      const milestones = [
        { threshold: 100, label: '100 XP', icon: '🎯' },
        { threshold: 250, label: '250 XP', icon: '⭐' },
        { threshold: 500, label: '500 XP', icon: '👑' },
        { threshold: 1000, label: 'AI Champion - 1000 XP', icon: '🏆' }
      ];
      const achievedBadges = milestones.filter((_, index) => unlocked.includes(index)).map((badge) => `${badge.icon} ${badge.label}`);
      const lockedBadges = milestones.filter((_, index) => !unlocked.includes(index)).map((badge) => `${badge.icon} ${badge.label}`);
      const nextBadge = badgeInfo.nextBadge;
      const progressText = nextBadge
        ? `${Math.max(nextBadge - totalXP, 0)} XP to next badge`
        : 'All badges unlocked';

      cardModalTitle.textContent = title;
      cardSubtitle.textContent = subtitle || 'Your badge progress and upcoming milestones';
      cardModalContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-chip"><strong>Current XP</strong><br>${totalXP}</div>
          <div class="stat-chip"><strong>Progress Toward Next Badge</strong><br>${progressText}</div>
        </div>
        <div class="stats-grid" style="margin-top: 1rem;">
          <div class="stat-chip"><strong>Achieved badges</strong><br>${achievedBadges.length > 0 ? achievedBadges.join('<br>') : 'None yet'}</div>
          <div class="stat-chip"><strong>Locked badges</strong><br>${lockedBadges.length > 0 ? lockedBadges.join('<br>') : 'None'}</div>
        </div>
      `;

      cardModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      return;
    }

    if (card.dataset.cardType === 'study-playlist') {
      cardModalTitle.textContent = 'Learning Videos & Focus Music';
      cardSubtitle.textContent = 'Curated study links and focus music';
      cardModalContent.innerHTML = `
        <div class="study-playlist-content">
          <div class="strategy-section">
            <h3>Focus Music</h3>
            <ul class="link-list">
              <li><a href="https://www.youtube.com/live/jfKfPfyJRdk" target="_blank" rel="noopener noreferrer">LoFi Girl</a></li>
              <li><a href="https://www.youtube.com/live/5yx6BWlEVcY" target="_blank" rel="noopener noreferrer">Chillhop Radio</a></li>
              <li><a href="https://www.youtube.com/results?search_query=relaxing+piano+study+music" target="_blank" rel="noopener noreferrer">Relaxing Piano Music</a></li>
            </ul>
          </div>
          <div class="strategy-section">
            <h3>Learning Videos</h3>
            <ul class="link-list">
              <li><a href="https://www.khanacademy.org" target="_blank" rel="noopener noreferrer">Khan Academy</a></li>
              <li><a href="https://www.youtube.com/@crashcourse" target="_blank" rel="noopener noreferrer">Crash Course</a></li>
              <li><a href="https://www.youtube.com/@TEDEd" target="_blank" rel="noopener noreferrer">TED-Ed</a></li>
            </ul>
          </div>
        </div>
      `;

      cardModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      return;
    }

    cardModalTitle.textContent = title;
    cardSubtitle.textContent = subtitle || 'More information';
    cardModalContent.innerHTML = content
      ? content
      : '<p>More information will be available soon.</p>';

    cardModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function hideCardModal() {
    if (cardModal) {
      cardModal.classList.add('hidden');
    }

    if (studyStrategiesModal) {
      studyStrategiesModal.classList.add('hidden');
    }

    document.body.style.overflow = '';
  }

  function isInteractiveElement(element) {
    return element.closest('a, button, input, textarea, select, label') !== null;
  }

  const revisionGuideCard = document.querySelector('.clickable-card[data-card-type="revision-guide"]');

  if (revisionGuideCard) {
    revisionGuideCard.addEventListener('click', (event) => {
      if (isInteractiveElement(event.target)) return;
      if (!studyStrategiesModal) return;
      studyStrategiesModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
    revisionGuideCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!studyStrategiesModal) return;
        studyStrategiesModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    });
    revisionGuideCard.setAttribute('tabindex', '0');
  }

  const studyPlaylistCard = document.querySelector('.clickable-card[data-card-type="study-playlist"]');

  if (studyPlaylistCard) {
    studyPlaylistCard.addEventListener('click', (event) => {
      if (isInteractiveElement(event.target)) return;
      showCardModal(studyPlaylistCard);
    });
    studyPlaylistCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showCardModal(studyPlaylistCard);
      }
    });
    studyPlaylistCard.setAttribute('tabindex', '0');
  }

  document.querySelectorAll('.clickable-card').forEach((card) => {
    if (card === revisionGuideCard || card === studyPlaylistCard) return;

    card.addEventListener('click', (event) => {
      if (isInteractiveElement(event.target)) return;
      showCardModal(card);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showCardModal(card);
      }
    });
    card.setAttribute('tabindex', '0');
  });

  if (cardClose) cardClose.addEventListener('click', hideCardModal);
  if (cardBackdrop) cardBackdrop.addEventListener('click', hideCardModal);
  if (studyStrategiesClose) studyStrategiesClose.addEventListener('click', hideCardModal);
  if (studyStrategiesBackdrop) studyStrategiesBackdrop.addEventListener('click', hideCardModal);

  document.addEventListener('keydown', (event) => {
    const cardModalOpen = cardModal && !cardModal.classList.contains('hidden');
    const studyModalOpen = studyStrategiesModal && !studyStrategiesModal.classList.contains('hidden');

    if (event.key === 'Escape' && (cardModalOpen || studyModalOpen)) {
      hideCardModal();
    }
  });

  // ===== NOTIFICATIONS =====
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 999px;
      box-shadow: 0 10px 30px rgba(123, 184, 255, 0.3);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      font-weight: 700;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  // Add notification animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // ✅ RESET PROGRESS BUTTON – ADDED HERE
  // ============================================================
  document.getElementById('reset-progress-btn')?.addEventListener('click', () => {
    if (confirm('Reset all XP, goals, and badges?')) {
      gamification.reset();
      updateProgressDisplay();
      renderGoals();
      showNotification('Progress reset!');
    }
  });

  // ===== INITIALIZE =====
  updateProgressDisplay();
  renderGoals();
});

// Mind Map Generation Event Listener
const mindMapButton = document.getElementById("generate-mindmap-btn");
if (mindMapButton) {
  mindMapButton.addEventListener("click", async () => {
    const inputData = document.getElementById("mindmap-input").value;
    const resultContainer = document.getElementById("mindmap-result-container");
    const button = document.getElementById("generate-mindmap-btn");

    if (!inputData.trim()) {
      alert("Please enter some notes or a topic first!");
      return;
    }

    button.innerText = "⏳ Mapping it out...";
    button.disabled = true;
    resultContainer.style.display = "block";
    resultContainer.innerHTML = `<p style="color: #7b7b93;">AI is organizing your branches, please wait...</p>`;

    try {
      const response = await fetch("/api/generate-mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: inputData })
      });

      const data = await response.json();

      resultContainer.innerHTML = `
        <div style="background: #f9f9ff; padding: 25px; border-radius: 16px; border-left: 5px solid #9b9bff;">
          <h4 style="color: #4A4A8A; margin-top: 0; margin-bottom: 15px;">Your Mind Map Breakdown:</h4>
          <pre style="font-family: inherit; font-size: 16px; line-height: 1.8; white-space: pre-wrap; margin: 0; color: #2d2d5a;">${data.result}</pre>
        </div>
      `;
    } catch (error) {
      resultContainer.innerHTML = `<p style="color: #000000;">Error generating mind map. Please try again.</p>`;
    } finally {
      button.innerText = "✨ Generate Mind Map";
      button.disabled = false;
    }
  });
<<<<<<< HEAD
=======
}

const youtubeForm = document.getElementById("youtube-form");
if (youtubeForm) {
  youtubeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const youtubeLinkInput = document.getElementById("youtube-link") || document.getElementById("youtubeLink");
    const noteStyleInput = document.getElementById("note-style") || document.getElementById("noteStyle");
    const youtubeLink = youtubeLinkInput ? youtubeLinkInput.value : "";
    const noteStyle = noteStyleInput ? noteStyleInput.value : "Summary";

    const resultDiv = document.getElementById("youtube-result") || document.getElementById("result");
    if (resultDiv) {
      resultDiv.textContent = "⏳ Generating notes...";
    }

    try {
      const response = await fetch("/api/youtube-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeLink, noteStyle })
      });

      const data = await response.json();

      if (data.success) {
        if (resultDiv) {
          resultDiv.textContent = data.notes;
        }
      } else if (resultDiv) {
        resultDiv.textContent = "❌ " + (data.message || "No notes were returned.");
      }
    } catch (err) {
      if (resultDiv) {
        resultDiv.textContent = "⚠️ Error generating notes.";
      }
      console.error(err);
    }
  });
>>>>>>> d75a237ca6709993da990aaadaf84dfd0f0328c9
}