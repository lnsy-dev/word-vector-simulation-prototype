class LoadingAnimation extends HTMLElement {
  constructor() {
    super();
    this.secondsElapsed = 0;
    this.intervalID = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <style>
        loading-animation {
          display: inline-block;
        }

        loading-animation #timer-container {
          display: inline-block;
        }

        loading-animation .dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          margin: 0 2px;
          background-color: var(--fg-color);
          border-radius: 50%;
          opacity: 0;
          animation: dot-blink 1.5s infinite;
        }

        loading-animation .dot:nth-child(1) {
          animation-delay: 0s;
        }

        loading-animation .dot:nth-child(2) {
          animation-delay: 0.3s;
        }

        loading-animation .dot:nth-child(3) {
          animation-delay: 0.6s;
        }



        @keyframes dot-blink {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      </style>

      <div id="loading-animation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div id="timer-container"><span id="timer">0</span>s</div>
      </div>
    `;

    // Start the timer
    this.startTimer();
  }

  disconnectedCallback() {
    // Stop the timer when component is removed
    this.stopTimer();
  }

  startTimer() {
    // Increment the secondsElapsed every 1000 ms (1 second)
    this.intervalID = setInterval(() => {
      this.secondsElapsed++;
      this.querySelector('#timer').textContent = this.secondsElapsed;
    }, 1000);
  }

  stopTimer() {
    // Clear the interval to stop the timer
    clearInterval(this.intervalID);
  }
}

customElements.define('loading-animation', LoadingAnimation);