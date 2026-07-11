/**
 * Gamification System
 * Manages XP, levels, badges, goals, and quiz scoring with localStorage persistence
 */
class GamificationSystem {
  constructor() {
    this.STORAGE_KEY = 'gamification_progress';
    this.XP_PER_LEVEL = 100;
    this.BADGE_THRESHOLDS = [100, 250, 500, 1000];
    this.QUIZ_XP = {
      easy: 5,
      medium: 10,
      hard: 15
    };
    this.GOAL_XP = 10;

    this.data = this.loadFromStorage();
    this.listeners = [];
  }

  // Load data from localStorage or initialize defaults
  loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      totalXP: 0,
      goals: [],
      quizzesTaken: 0,
      unlockedBadges: [],
      createdAt: new Date().toISOString()
    };
  }

  // Save data to localStorage
  saveToStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    this.notifyListeners();
  }

  // Get current level based on total XP
  getLevel() {
    return Math.floor(this.data.totalXP / this.XP_PER_LEVEL) + 1;
  }

  // Get XP progress toward next level
  getXPProgress() {
    const xpInCurrentLevel = this.data.totalXP % this.XP_PER_LEVEL;
    const percentage = (xpInCurrentLevel / this.XP_PER_LEVEL) * 100;
    return {
      current: xpInCurrentLevel,
      needed: this.XP_PER_LEVEL,
      percentage: Math.round(percentage)
    };
  }

  // Add XP and return any newly unlocked badges
  addXP(amount) {
    const oldBadges = this.data.unlockedBadges.length;
    this.data.totalXP += amount;

    // Check for newly unlocked badges
    const newBadges = [];
    this.BADGE_THRESHOLDS.forEach((threshold, index) => {
      if (this.data.totalXP >= threshold && !this.data.unlockedBadges.includes(index)) {
        this.data.unlockedBadges.push(index);
        newBadges.push({ threshold, index });
      }
    });

    this.saveToStorage();
    return newBadges;
  }

  // Add a study goal
  addGoal(text) {
    const goal = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.data.goals.push(goal);
    this.saveToStorage();
    return goal;
  }

  // Complete a goal and earn XP
  completeGoal(goalId) {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (goal && !goal.completed) {
      goal.completed = true;
      goal.completedAt = new Date().toISOString();
      const newBadges = this.addXP(this.GOAL_XP);
      return { xpEarned: this.GOAL_XP, newBadges };
    }
    return null;
  }

  // Remove a goal
  removeGoal(goalId) {
    this.data.goals = this.data.goals.filter(g => g.id !== goalId);
    this.saveToStorage();
  }

  // Record quiz completion and earn XP
  completeQuiz(difficulty, score, total) {
    this.data.quizzesTaken += 1;
    const xpPerCorrect = this.QUIZ_XP[difficulty] || 10;
    const xpEarned = score * xpPerCorrect;
    const newBadges = this.addXP(xpEarned);
    return { xpEarned, newBadges };
  }

  // Get all goals
  getGoals() {
    return this.data.goals;
  }

  // Get pending goals
  getPendingGoals() {
    return this.data.goals.filter(g => !g.completed);
  }

  // Get completed goals
  getCompletedGoals() {
    return this.data.goals.filter(g => g.completed);
  }

  // Get badge info
  getBadgeInfo() {
    return {
      unlocked: this.data.unlockedBadges,
      total: this.BADGE_THRESHOLDS.length,
      thresholds: this.BADGE_THRESHOLDS,
      nextBadge: this.getNextBadgeThreshold()
    };
  }

  // Get next badge to unlock
  getNextBadgeThreshold() {
    for (let threshold of this.BADGE_THRESHOLDS) {
      if (this.data.totalXP < threshold) {
        return threshold;
      }
    }
    return null;
  }

  // Get activity count (quizzes + completed goals)
  getActivityCount() {
    return this.data.quizzesTaken + this.getCompletedGoals().length;
  }

  // Get total XP
  getTotalXP() {
    return this.data.totalXP;
  }

  // Get number of quizzes taken (added from the simpler version)
  getQuizzesTaken() {
    return this.data.quizzesTaken || 0;
  }

  // Register listener for updates
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Notify all listeners of updates
  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // Reset all progress (for testing)
  reset() {
    this.data = {
      totalXP: 0,
      goals: [],
      quizzesTaken: 0,
      unlockedBadges: [],
      createdAt: new Date().toISOString()
    };
    this.saveToStorage();
  }
}

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GamificationSystem;
}