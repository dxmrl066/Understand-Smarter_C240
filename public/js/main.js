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
  const loading = document.getElementById('loading'); // <-- FIXED: Added missing loading element selector
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

    currentLevel.textContent = `Level ${level}`;
    xpPoints.textContent = totalXP;
    xpNeeded.textContent = xpProgress.needed;
    badgeCount.textContent = badgeInfo.unlocked.length;
    activityCount.textContent = actCount;
    completedGoalsCount.textContent = completedGoals.length;
    quizzesTakenCount.textContent = gamification.data.quizzesTaken || 0;

    // Update progress ring
    animateProgress(xpProgress.percentage);

    // Update next badge
    const nextBadge = badgeInfo.nextBadge;
    if (nextBadge) {
      nextBadgeChip.innerHTML = `<strong>${nextBadge}</strong> XP to unlock badge`;
    } else {
      nextBadgeChip.innerHTML = `<strong>Max</strong> badges unlocked!`;
    }

    // Update badge milestone badges
    updateBadgeMilestones(badgeInfo);

    // Update milestone message
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

  function updateBadgeMilestones(badgeInfo) {
    const badges = [
      { element: badge100, threshold: 100, icon: '🎯' },
      { element: badge250, threshold: 250, icon: '⭐' },
      { element: badge500, threshold: 500, icon: '👑' }
    ];

    badges.forEach((badge, index) => {
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

    // UPDATED: Adjusted branding text to display Gemini AI title seamlessly
    if (quizTitle) quizTitle.textContent = "Your Gemini AI Quiz";
    if (quizDescription) quizDescription.textContent = `${safeQuestions.length} AI-generated questions`;
    
    quizQuestionList.innerHTML = "";
    isQuizSubmitted = false; // Reset submit lock out

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

    // Toggle loader styles gracefully to prevent submission flooding
    quizGenerateBtn.disabled = true;
    quizGenerateBtn.textContent = "Generating Quiz...";
    if (loading) loading.classList.remove('hidden');

    try {
      // Hit your node.js backend internal API router endpoint seamlessly
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
    // If user clicks complete button twice, don't let them farm infinite XP
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

      // Color feedback markers for structural elements
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

    // Calculate dynamic XP reward base (e.g., 10XP per correct answer)
    const xpReward = score * 10;

    // AWARD GAMIFICATION POINTS HERE
    if (xpReward > 0) {
      gamification.data.totalXP = (gamification.data.totalXP || 0) + xpReward;
      showNotification(`Quiz Completed! +${xpReward} XP awarded!`);
    }
    gamification.data.quizzesTaken = (gamification.data.quizzesTaken || 0) + 1;
    
    // Save progress updates
    if (typeof gamification.saveData === 'function') {
      gamification.saveData();
    }
    updateProgressDisplay();

    // Show results values in UI panel
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

  // ===== INITIALIZE =====
  updateProgressDisplay();
  renderGoals();
});

// Mind Map Generation Event Listener
document.getElementById("generate-mindmap-btn").addEventListener("click", async () => {
    const inputData = document.getElementById("mindmap-input").value;
    const resultContainer = document.getElementById("mindmap-result-container");
    const button = document.getElementById("generate-mindmap-btn");

    if (!inputData.trim()) {
        alert("Please enter some notes or a topic first!");
        return;
    }

    // Show loading state
    button.innerText = "⏳ Mapping it out...";
    button.disabled = true;
    resultContainer.style.display = "block";
    resultContainer.innerHTML = `<p style="color: #7b7b93;">AI is organizing your branches, please wait...</p>`;

    try {
        // Send a request to your server backend route
        const response = await fetch("/api/generate-mindmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: inputData })
        });

        const data = await response.json();

        // Display the hierarchical mind map tree perfectly
        resultContainer.innerHTML = `
            <div style="background: #f9f9ff; padding: 25px; border-radius: 16px; border-left: 5px solid #9b9bff;">
                <h4 style="color: #4A4A8A; margin-top: 0; margin-bottom: 15px;">Your Mind Map Breakdown:</h4>
                <pre style="font-family: inherit; font-size: 16px; line-height: 1.8; white-space: pre-wrap; margin: 0; color: #2d2d5a;">${data.result}</pre>
            </div>
        `;
    } catch (error) {
        resultContainer.innerHTML = `<p style="color: #ff6b6b;">Error generating mind map. Please try again.</p>`;
    } finally {
        button.innerText = "✨ Generate Mind Map";
        button.disabled = false;
    }
});