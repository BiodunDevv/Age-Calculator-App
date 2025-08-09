/**
 * Age Calculator App
 * A modern, interactive age calculator with PWA features
 * Handles validation, animations, and responsive design
 */

class AgeCalculator {
  constructor() {
    this.elements = this.initializeElements();
    this.state = {
      isCalculating: false,
      currentDate: new Date(),
      theme: this.getStoredTheme(),
    };

    this.init();
  }

  initializeElements() {
    return {
      // Form elements
      form: document.getElementById("age-form"),
      dayInput: document.getElementById("day"),
      monthInput: document.getElementById("month"),
      yearInput: document.getElementById("year"),
      calculateBtn: document.getElementById("calculate-btn"),
      clearBtn: document.getElementById("clear-btn"),

      // Error elements
      dayError: document.getElementById("day-error"),
      monthError: document.getElementById("month-error"),
      yearError: document.getElementById("year-error"),

      // Results modal elements
      modal: document.getElementById("results-modal"),
      modalClose: document.getElementById("modal-close"),
      ageYears: document.getElementById("age-years"),
      ageMonths: document.getElementById("age-months"),
      ageDays: document.getElementById("age-days"),
      birthDate: document.getElementById("birth-date"),
      totalDays: document.getElementById("total-days"),

      // Theme toggle
      themeToggle: document.getElementById("theme-toggle"),

      // PWA elements
      pwaPrompt: document.getElementById("pwa-prompt"),
      pwaInstallBtn: document.getElementById("pwa-install-btn"),
      pwaDismissBtn: document.getElementById("pwa-dismiss-btn"),

      // Loading spinner
      loadingSpinner: document.getElementById("loading-spinner"),
    };
  }

  init() {
    this.setupEventListeners();
    this.setupTheme();
    this.loadStoredData();
    this.setupPWA();
    this.setupAccessibility();

    // Focus first input on load
    setTimeout(() => this.elements.dayInput.focus(), 100);
  }

  setupEventListeners() {
    // Form submission
    this.elements.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.calculateAge();
    });

    // Input validation and auto-advance
    this.elements.dayInput.addEventListener("input", (e) =>
      this.handleDayInput(e)
    );
    this.elements.monthInput.addEventListener("input", (e) =>
      this.handleMonthInput(e)
    );
    this.elements.yearInput.addEventListener("input", (e) =>
      this.handleYearInput(e)
    );

    // Input blur validation
    this.elements.dayInput.addEventListener("blur", () => this.validateDay());
    this.elements.monthInput.addEventListener("blur", () =>
      this.validateMonth()
    );
    this.elements.yearInput.addEventListener("blur", () => this.validateYear());

    // Clear button
    this.elements.clearBtn.addEventListener("click", () => this.clearForm());

    // Modal controls
    this.elements.modalClose.addEventListener("click", () => this.hideModal());
    this.elements.modal.addEventListener("click", (e) => {
      if (e.target === this.elements.modal) this.hideModal();
    });

    // Theme toggle
    this.elements.themeToggle.addEventListener("click", () =>
      this.toggleTheme()
    );

    // PWA controls
    this.elements.pwaInstallBtn.addEventListener("click", () =>
      this.installPWA()
    );
    this.elements.pwaDismissBtn.addEventListener("click", () =>
      this.dismissPWA()
    );

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );

    // Window resize for responsive adjustments
    window.addEventListener("resize", () => this.handleResize());
  }

  handleDayInput(e) {
    const value = e.target.value;
    this.clearError("day");

    if (value.length >= 2) {
      const day = parseInt(value);
      if (day >= 1 && day <= 31) {
        e.target.classList.add("auto-advance");
        setTimeout(() => {
          e.target.classList.remove("auto-advance");
          this.elements.monthInput.focus();
        }, 300);
      }
    }

    this.saveToStorage();
  }

  handleMonthInput(e) {
    const value = e.target.value;
    this.clearError("month");

    if (value.length >= 2) {
      const month = parseInt(value);
      if (month >= 1 && month <= 12) {
        e.target.classList.add("auto-advance");
        setTimeout(() => {
          e.target.classList.remove("auto-advance");
          this.elements.yearInput.focus();
        }, 300);
      }
    }

    this.saveToStorage();
  }

  handleYearInput(e) {
    this.clearError("year");

    if (e.target.value.length >= 4) {
      e.target.classList.add("auto-advance");
      setTimeout(() => {
        e.target.classList.remove("auto-advance");
      }, 300);
    }

    this.saveToStorage();
  }

  validateDay() {
    const day = parseInt(this.elements.dayInput.value);
    const month = parseInt(this.elements.monthInput.value) || 1;
    const year =
      parseInt(this.elements.yearInput.value) || new Date().getFullYear();

    if (!day) {
      this.showError("day", "Day is required");
      return false;
    }

    if (day < 1 || day > 31) {
      this.showError("day", "Day must be between 1 and 31");
      return false;
    }

    // Check if day is valid for the given month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      this.showError(
        "day",
        `${this.getMonthName(month)} has only ${daysInMonth} days`
      );
      return false;
    }

    this.elements.dayInput.classList.add("success");
    return true;
  }

  validateMonth() {
    const month = parseInt(this.elements.monthInput.value);

    if (!month) {
      this.showError("month", "Month is required");
      return false;
    }

    if (month < 1 || month > 12) {
      this.showError("month", "Month must be between 1 and 12");
      return false;
    }

    this.elements.monthInput.classList.add("success");
    return true;
  }

  validateYear() {
    const year = parseInt(this.elements.yearInput.value);
    const currentYear = new Date().getFullYear();

    if (!year) {
      this.showError("year", "Year is required");
      return false;
    }

    if (year < 1900 || year > currentYear + 10) {
      this.showError(
        "year",
        `Year must be between 1900 and ${currentYear + 10}`
      );
      return false;
    }

    this.elements.yearInput.classList.add("success");
    return true;
  }

  showError(field, message) {
    const errorElement = this.elements[`${field}Error`];
    const inputElement = this.elements[`${field}Input`];

    errorElement.textContent = message;
    errorElement.classList.add("show");
    inputElement.classList.add("error");
    inputElement.classList.remove("success");
  }

  clearError(field) {
    const errorElement = this.elements[`${field}Error`];
    const inputElement = this.elements[`${field}Input`];

    errorElement.classList.remove("show");
    inputElement.classList.remove("error");
  }

  async calculateAge() {
    if (this.state.isCalculating) return;

    // Validate all inputs
    const isDayValid = this.validateDay();
    const isMonthValid = this.validateMonth();
    const isYearValid = this.validateYear();

    if (!isDayValid || !isMonthValid || !isYearValid) {
      this.shake(this.elements.calculateBtn);
      return;
    }

    this.state.isCalculating = true;
    this.showLoading();

    try {
      // Simulate calculation delay for better UX
      await this.delay(800);

      const day = parseInt(this.elements.dayInput.value);
      const month = parseInt(this.elements.monthInput.value);
      const year = parseInt(this.elements.yearInput.value);

      const birthDate = new Date(year, month - 1, day);
      const today = new Date();

      // Check if birth date is in the future
      if (birthDate > today) {
        this.showFutureDate(birthDate);
        return;
      }

      const age = this.calculateExactAge(birthDate, today);
      this.displayResults(age, birthDate);
    } catch (error) {
      console.error("Calculation error:", error);
      this.showError("year", "An error occurred during calculation");
    } finally {
      this.state.isCalculating = false;
      this.hideLoading();
    }
  }

  calculateExactAge(birthDate, currentDate) {
    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();
    let days = currentDate.getDate() - birthDate.getDate();

    // Adjust for negative days
    if (days < 0) {
      months--;
      const lastMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      );
      days += lastMonth.getDate();
    }

    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }

    // Calculate total days
    const totalDays = Math.floor(
      (currentDate - birthDate) / (1000 * 60 * 60 * 24)
    );

    return { years, months, days, totalDays };
  }

  displayResults(age, birthDate) {
    // Animate numbers
    this.animateNumber(this.elements.ageYears, age.years);
    this.animateNumber(this.elements.ageMonths, age.months);
    this.animateNumber(this.elements.ageDays, age.days);
    this.animateNumber(this.elements.totalDays, age.totalDays);

    // Format birth date
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    this.elements.birthDate.textContent = birthDate.toLocaleDateString(
      "en-US",
      options
    );

    this.showModal();
  }

  showFutureDate(birthDate) {
    const today = new Date();
    const age = this.calculateExactAge(today, birthDate);

    this.elements.ageYears.textContent = age.years;
    this.elements.ageMonths.textContent = age.months;
    this.elements.ageDays.textContent = age.days;
    this.elements.totalDays.textContent = age.totalDays;

    // Show special message for future dates
    const options = { year: "numeric", month: "long", day: "numeric" };
    this.elements.birthDate.textContent = `Future date: ${birthDate.toLocaleDateString(
      "en-US",
      options
    )}`;

    // Update modal title for future dates
    document.querySelector(".modal-title").textContent = "Time Until Date";

    this.showModal();
  }

  animateNumber(element, target) {
    const start = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  showModal() {
    this.elements.modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Focus management for accessibility
    setTimeout(() => {
      this.elements.modalClose.focus();
    }, 300);
  }

  hideModal() {
    this.elements.modal.classList.remove("show");
    document.body.style.overflow = "";

    // Return focus to form
    this.elements.calculateBtn.focus();

    // Reset modal title
    document.querySelector(".modal-title").textContent = "Your Age";
  }

  clearForm() {
    this.elements.dayInput.value = "";
    this.elements.monthInput.value = "";
    this.elements.yearInput.value = "";

    // Clear all errors and success states
    ["day", "month", "year"].forEach((field) => {
      this.clearError(field);
      this.elements[`${field}Input`].classList.remove("success");
    });

    // Clear storage
    localStorage.removeItem("age-calculator-data");

    // Focus first input
    this.elements.dayInput.focus();

    // Add clear animation
    this.elements.form.style.transform = "scale(0.98)";
    setTimeout(() => {
      this.elements.form.style.transform = "";
    }, 150);
  }

  setupTheme() {
    document.documentElement.setAttribute("data-theme", this.state.theme);
  }

  toggleTheme() {
    this.state.theme = this.state.theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.state.theme);
    localStorage.setItem("theme", this.state.theme);

    // Animate theme toggle
    this.elements.themeToggle.style.transform = "rotate(180deg) scale(1.1)";
    setTimeout(() => {
      this.elements.themeToggle.style.transform = "";
    }, 300);
  }

  getStoredTheme() {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  saveToStorage() {
    const data = {
      day: this.elements.dayInput.value,
      month: this.elements.monthInput.value,
      year: this.elements.yearInput.value,
      timestamp: Date.now(),
    };
    localStorage.setItem("age-calculator-data", JSON.stringify(data));
  }

  loadStoredData() {
    try {
      const stored = localStorage.getItem("age-calculator-data");
      if (!stored) return;

      const data = JSON.parse(stored);
      const daysDiff = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);

      // Only load if less than 30 days old
      if (daysDiff < 30) {
        this.elements.dayInput.value = data.day || "";
        this.elements.monthInput.value = data.month || "";
        this.elements.yearInput.value = data.year || "";
      }
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  }

  setupPWA() {
    let deferredPrompt;

    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showPWAPrompt();
    });

    // Handle PWA install
    this.elements.pwaInstallBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("PWA installed successfully");
      }

      deferredPrompt = null;
      this.hidePWAPrompt();
    });

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }
  }

  showPWAPrompt() {
    this.elements.pwaPrompt.style.display = "block";
    setTimeout(() => {
      this.elements.pwaPrompt.classList.add("show");
    }, 100);
  }

  hidePWAPrompt() {
    this.elements.pwaPrompt.classList.remove("show");
    setTimeout(() => {
      this.elements.pwaPrompt.style.display = "none";
    }, 300);
  }

  dismissPWA() {
    this.hidePWAPrompt();
    localStorage.setItem("pwa-dismissed", Date.now().toString());
  }

  installPWA() {
    // This will be handled by the beforeinstallprompt event listener
  }

  setupAccessibility() {
    // Add ARIA live region for screen readers
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    liveRegion.id = "live-region";
    document.body.appendChild(liveRegion);

    // Announce calculation results to screen readers
    this.liveRegion = liveRegion;
  }

  announceToScreenReader(message) {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
      setTimeout(() => {
        this.liveRegion.textContent = "";
      }, 1000);
    }
  }

  handleKeyboardShortcuts(e) {
    // Escape to close modal
    if (e.key === "Escape" && this.elements.modal.classList.contains("show")) {
      this.hideModal();
      return;
    }

    // Ctrl/Cmd + Enter to calculate
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      this.calculateAge();
      return;
    }

    // Ctrl/Cmd + K to clear
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      this.clearForm();
      return;
    }

    // Tab navigation enhancement
    if (e.key === "Tab") {
      this.handleTabNavigation(e);
    }
  }

  handleTabNavigation(e) {
    const inputs = [
      this.elements.dayInput,
      this.elements.monthInput,
      this.elements.yearInput,
    ];
    const currentIndex = inputs.findIndex(
      (input) => input === document.activeElement
    );

    if (currentIndex !== -1 && !e.shiftKey) {
      const currentInput = inputs[currentIndex];
      if (currentInput.value && currentIndex < inputs.length - 1) {
        // Auto-advance on tab if field is filled
        e.preventDefault();
        inputs[currentIndex + 1].focus();
      }
    }
  }

  handleResize() {
    // Adjust modal height on mobile landscape
    if (window.innerHeight < 500 && window.innerWidth > 600) {
      this.elements.modal.style.maxHeight = "90vh";
    } else {
      this.elements.modal.style.maxHeight = "80vh";
    }
  }

  // Utility functions
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  shake(element) {
    element.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => {
      element.style.animation = "";
    }, 500);

    // Add shake keyframes if not already present
    if (!document.querySelector("#shake-keyframes")) {
      const style = document.createElement("style");
      style.id = "shake-keyframes";
      style.textContent = `
        @keyframes shake {
          0%, 20%, 40%, 60%, 80%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  showLoading() {
    this.elements.calculateBtn.classList.add("loading");
    this.elements.loadingSpinner.style.display = "flex";
  }

  hideLoading() {
    this.elements.calculateBtn.classList.remove("loading");
    this.elements.loadingSpinner.style.display = "none";
  }

  getMonthName(monthNumber) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthNumber - 1];
  }

  // Initialize leap year checking
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AgeCalculator();
});

// Add screen reader only styles
const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = srOnlyStyles;
document.head.appendChild(styleSheet);
