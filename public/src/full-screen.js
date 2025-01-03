class FullScreen extends HTMLElement {
  connectedCallback(){
    this.button = document.createElement('button');
    this.button.classList.add('small-button');
    this.button.innerText = '⛶';
    this.appendChild(this.button);
    this.button.addEventListener('click', (e) => {
      this.toggleFullScreen();
    })
  }

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      // Enter full screen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) { // Firefox
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
        document.documentElement.msRequestFullscreen();
      }
    } else {
      // Exit full screen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }
  }
}

customElements.define('full-screen', FullScreen)