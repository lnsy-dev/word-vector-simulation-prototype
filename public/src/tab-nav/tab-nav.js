/*
Use this code like:

        <tab-nav-menu target="nav-tabs"></tab-nav-menu>
        <tab-nav-body id="nav-tabs">
            <tab-nav-item name="search">Search</tab-nav-item>
            <tab-nav-item name="index">Index</tab-nav-item>
            <tab-nav-item name="projects">Projects</tab-nav-item>
            <tab-nav-item name="settings">Settings</tab-nav-item>
        </tab-nav-body>
*/

import DataroomElement from '../dataroom.js';

class TabNavMenu extends DataroomElement {
  // Initialize the tab navigation menu
  initialize() {
    this.status = this.create("div");
    this.target = document.getElementById(this.getAttribute("target"));
    if (this.target) {
      this.renderTabs();
    }
    this.setupKeyboardShortcuts(); // Set up keyboard shortcuts
  }

  // Render tabs based on linked tab-nav-items
  renderTabs() {
    const items = this.target.querySelectorAll('tab-nav-item');
    items.forEach(item => {
      const tabLink = this.create('a', { href: `#${item.getAttribute('name')}`, content: item.getAttribute('name') });
      tabLink.addEventListener('click', (e) => this.handleTabClick(e, item));
      this.appendChild(tabLink);
    });

    if (items.length > 0) {
      this.setActiveTab(items[0]); // Optionally set the first tab as active on init
    }
  }

  // Handle clicking a tab
  handleTabClick(event, item) {
    event.preventDefault();
    this.clearActiveTabs();
    this.setActiveTab(item);
  }

  // Remove active state from all tabs and items
  clearActiveTabs() {
    this.querySelectorAll('a').forEach(link => link.classList.remove('active'));
    this.target.querySelectorAll('tab-nav-item').forEach(item => item.classList.remove('active'));
  }

  // Set active state on a specific tab and item
  setActiveTab(item) {
    item.classList.add('active');
    this.querySelector(`a[href="#${item.getAttribute('name')}"]`).classList.add('active');
    this.event('active-tab-set', { activeTab: item });
  }

  // Setup keyboard shortcuts for tabs
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        const key = parseInt(e.key, 10);
        if (key >= 1 && key <= 9) {
          this.activateTabByIndex(key - 1); // Convert to zero-based index
        } else if (e.key === '0') {
          this.activateTabByIndex(9); // Access the 10th tab with '0' (index 9)
        }
      }
    });
  }

  // Activate tab by its index
  activateTabByIndex(index) {
    const items = this.target.querySelectorAll('tab-nav-item');
    if (index >= 0 && index < items.length) {
      this.clearActiveTabs();
      this.setActiveTab(items[index]);
    }
  }

  // Activate tab by its name
  setActiveTabByName(tabName) {
    const item = Array.from(this.target.querySelectorAll('tab-nav-item')).find(item => item.getAttribute('name') === tabName);
    if (item) {
      this.clearActiveTabs();
      this.setActiveTab(item);
    }
  }
}
customElements.define('tab-nav-menu', TabNavMenu);

class TabNavBody extends DataroomElement {
  // Initialize the tab body
  initialize() {
    this.classList.add('tab-content');
  }
}
customElements.define('tab-nav-body', TabNavBody);

class TabNavItem extends DataroomElement {
  // Initialize individual tab items
  initialize() {
    this.status = this.create("div");
    this.classList.add('tab-pane');
  }
}
customElements.define('tab-nav-item', TabNavItem);