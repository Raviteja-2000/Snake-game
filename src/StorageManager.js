// Storage Manager - LocalStorage and persistence
// Responsible for all data persistence

export class StorageManager {
  constructor(prefix = 'snake_ultra_') {
    this.prefix = prefix;
  }

  // Save value to localStorage
  save(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  }

  // Load value from localStorage
  load(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Storage read error:', e);
      return defaultValue;
    }
  }

  // Delete value from localStorage
  delete(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      console.error('Storage delete error:', e);
      return false;
    }
  }

  // Clear all storage with this prefix
  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }

  // Get leaderboard
  getLeaderboard() {
    return this.load('lb', []);
  }

  // Save leaderboard
  setLeaderboard(scores) {
    return this.save('lb', scores.slice(0, 10));
  }

  // Add score to leaderboard
  addScore(score) {
    const lb = this.getLeaderboard();
    lb.push(score);
    lb.sort((a, b) => b.score - a.score);
    this.setLeaderboard(lb);
    return lb.slice(0, 10);
  }
}

export default StorageManager;