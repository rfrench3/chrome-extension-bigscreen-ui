// Controller Navigation using HTML5 Gamepad API
class ControllerNavigator {
  constructor() {
    this.gamepads = {};
    this.previousButtonStates = {};
    this.previousAnalogStates = {};
    this.isPolling = false;
    
    // Button mappings (standard gamepad layout)
    this.buttonMap = {
      0: 'A',           // A button (bottom face button)
      1: 'B',           // B button (right face button)
      2: 'X',           // X button (left face button)
      3: 'Y',           // Y button (top face button)
      4: 'LB',          // Left bumper
      5: 'RB',          // Right bumper
      6: 'LT',          // Left trigger
      7: 'RT',          // Right trigger
      8: 'Back',        // Back/Select button
      9: 'Start',       // Start/Menu button
      10: 'LS',         // Left stick button
      11: 'RS',         // Right stick button
      12: 'DPadUp',     // D-pad up
      13: 'DPadDown',   // D-pad down
      14: 'DPadLeft',   // D-pad left
      15: 'DPadRight',  // D-pad right
      16: 'Home'        // Home/Guide button (if available)
    };
    
    this.init();
  }
  
  init() {
    // Check if Gamepad API is supported
    if (!navigator.getGamepads) {
      console.warn('Gamepad API not supported in this browser');
      return;
    }
    
    // Listen for gamepad connect/disconnect events
    window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
    
    // Start polling for existing gamepads
    this.startPolling();
    
    console.log('Controller Navigator initialized');
  }
  
  onGamepadConnected(event) {
    const gamepad = event.gamepad;
    console.log(`Gamepad connected: ${gamepad.id} (${gamepad.index})`);
    this.gamepads[gamepad.index] = gamepad;
    this.previousButtonStates[gamepad.index] = [];
    this.previousAnalogStates[gamepad.index] = {
      leftX: 0, leftY: 0, rightX: 0, rightY: 0
    };
  }
  
  onGamepadDisconnected(event) {
    const gamepad = event.gamepad;
    console.log(`Gamepad disconnected: ${gamepad.id} (${gamepad.index})`);
    delete this.gamepads[gamepad.index];
    delete this.previousButtonStates[gamepad.index];
    delete this.previousAnalogStates[gamepad.index];
  }
  
  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollGamepads();
  }
  
  stopPolling() {
    this.isPolling = false;
  }
  
  pollGamepads() {
    if (!this.isPolling) return;
    
    // Get current gamepad states
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        this.processGamepadInput(gamepad);
      }
    }
    
    // Continue polling
    requestAnimationFrame(() => this.pollGamepads());
  }
  
  processGamepadInput(gamepad) {
    const index = gamepad.index;
    
    // Initialize previous states if not exists
    if (!this.previousButtonStates[index]) {
      this.previousButtonStates[index] = [];
    }
    if (!this.previousAnalogStates[index]) {
      this.previousAnalogStates[index] = {
        leftX: 0, leftY: 0, rightX: 0, rightY: 0
      };
    }
    
    // Check each button
    for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
      const button = gamepad.buttons[buttonIndex];
      const previousState = this.previousButtonStates[index][buttonIndex] || false;
      const currentState = button.pressed;
      
      // Detect button press (not held)
      if (currentState && !previousState) {
        this.onButtonPressed(gamepad, buttonIndex, button);
      }
      
      // Detect button release
      if (!currentState && previousState) {
        this.onButtonReleased(gamepad, buttonIndex, button);
      }
      
      // Update previous state
      this.previousButtonStates[index][buttonIndex] = currentState;
    }
    
    // Process analog sticks
    this.processAnalogSticks(gamepad);
  }
  
  onButtonPressed(gamepad, buttonIndex, button) {
    const buttonName = this.buttonMap[buttonIndex] || `Button${buttonIndex}`;
    console.log(`Button pressed: ${buttonName} (${buttonIndex}) on gamepad ${gamepad.index}`);
    
    // Handle specific button actions
    switch (buttonIndex) {
      case 0: // A button - simulate Enter/Click
        this.simulateEnterKey();
        break;
      case 1: // B button - simulate Escape/Back
        this.simulateEscapeKey();
        break;
      case 4: // LB button - simulate Shift+Tab for reverse accessibility navigation
        this.simulateShiftTabKey();
        break;
      case 5: // RB button - simulate Tab for accessibility navigation
        this.simulateTabKey();
        break;
      case 12: // D-pad Up - navigate up
        this.navigateUp();
        break;
      case 13: // D-pad Down - navigate down
        this.navigateDown();
        break;
      case 14: // D-pad Left - navigate left
        this.navigateLeft();
        break;
      case 15: // D-pad Right - navigate right
        this.navigateRight();
        break;
      default:
        // Custom handler for other buttons
        this.handleCustomButton(buttonName, buttonIndex, gamepad);
    }
    
    // Dispatch custom event
    this.dispatchControllerEvent('buttonpress', {
      gamepad: gamepad,
      button: buttonIndex,
      buttonName: buttonName,
      value: button.value
    });
  }
  
  onButtonReleased(gamepad, buttonIndex, button) {
    const buttonName = this.buttonMap[buttonIndex] || `Button${buttonIndex}`;
    console.log(`Button released: ${buttonName} (${buttonIndex}) on gamepad ${gamepad.index}`);
    
    // Dispatch custom event
    this.dispatchControllerEvent('buttonrelease', {
      gamepad: gamepad,
      button: buttonIndex,
      buttonName: buttonName,
      value: button.value
    });
  }
  
  processAnalogSticks(gamepad) {
    const index = gamepad.index;
    
    // Left stick
    const leftX = gamepad.axes[0] || 0;
    const leftY = gamepad.axes[1] || 0;
    
    // Right stick  
    const rightX = gamepad.axes[2] || 0;
    const rightY = gamepad.axes[3] || 0;
    
    // Get previous states
    const prevState = this.previousAnalogStates[index];
    
    // Dead zone threshold
    const deadZone = 0.1;
    const changeThreshold = 0.05; // Only log if change is significant
    
    // Check for significant changes in left stick
    if (Math.abs(leftX - prevState.leftX) > changeThreshold || 
        Math.abs(leftY - prevState.leftY) > changeThreshold) {
      
      // Handle left stick navigation (with dead zone)
      if (Math.abs(leftX) > deadZone || Math.abs(leftY) > deadZone) {
        this.handleAnalogNavigation(leftX, leftY, 'left-stick');
      }
      
      // Update previous state
      prevState.leftX = leftX;
      prevState.leftY = leftY;
    }
    
    // Check for significant changes in right stick
    if (Math.abs(rightX - prevState.rightX) > changeThreshold || 
        Math.abs(rightY - prevState.rightY) > changeThreshold) {
      
      // Handle right stick (if needed for scrolling, etc.)
      if (Math.abs(rightX) > deadZone || Math.abs(rightY) > deadZone) {
        this.handleAnalogNavigation(rightX, rightY, 'right-stick');
      }
      
      // Update previous state
      prevState.rightX = rightX;
      prevState.rightY = rightY;
    }
  }
  
  handleAnalogNavigation(x, y, stickName) {
    // Implement analog stick navigation logic here
    // This could be used for smooth scrolling or cursor movement
    console.log(`${stickName} movement: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
  }
  
  // Navigation methods
  simulateEnterKey() {
    // Try to click the currently focused element first
    const focusedElement = document.activeElement;
    if (focusedElement && (focusedElement.tagName === 'BUTTON' || 
                          focusedElement.tagName === 'A' || 
                          focusedElement.type === 'submit' ||
                          focusedElement.role === 'button')) {
      focusedElement.click();
      return;
    }
    
    // Fall back to keyboard events
    this.dispatchKeyEvent('Enter', 13);
  }
  
  simulateEscapeKey() {
    this.dispatchKeyEvent('Escape', 27);
  }
  
  simulateTabKey() {
    // Get all focusable elements
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    if (focusableElements.length > 0) {
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      focusableElements[nextIndex].focus();
    } else {
      // Fall back to keyboard event
      this.dispatchKeyEvent('Tab', 9);
    }
  }
  
  simulateShiftTabKey() {
    // Get all focusable elements
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    if (focusableElements.length > 0) {
      const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusableElements[prevIndex].focus();
    } else {
      // Fall back to keyboard event
      this.dispatchKeyEvent('Tab', 9, { shiftKey: true });
    }
  }
  
  getFocusableElements() {
    const selector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    const elements = Array.from(document.querySelectorAll(selector));
    
    return elements.filter(element => {
      return element.offsetWidth > 0 && 
             element.offsetHeight > 0 && 
             !element.disabled && 
             getComputedStyle(element).visibility !== 'hidden';
    });
  }
  
  dispatchKeyEvent(key, keyCode, options = {}) {
    const target = document.activeElement || document.body;
    
    // Create and dispatch keydown event
    const keydownEvent = new KeyboardEvent('keydown', {
      key: key,
      code: key,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options
    });
    
    // Create and dispatch keyup event
    const keyupEvent = new KeyboardEvent('keyup', {
      key: key,
      code: key,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options
    });
    
    target.dispatchEvent(keydownEvent);
    
    // Small delay before keyup
    setTimeout(() => {
      target.dispatchEvent(keyupEvent);
    }, 50);
  }
  
  navigateUp() {
    this.simulateArrowKey('ArrowUp');
  }
  
  navigateDown() {
    this.simulateArrowKey('ArrowDown');
  }
  
  navigateLeft() {
    this.simulateArrowKey('ArrowLeft');
  }
  
  navigateRight() {
    this.simulateArrowKey('ArrowRight');
  }
  
  simulateArrowKey(keyName) {
    const keyCode = {
      'ArrowUp': 38,
      'ArrowDown': 40,
      'ArrowLeft': 37,
      'ArrowRight': 39
    }[keyName];
    
    this.dispatchKeyEvent(keyName, keyCode);
  }
  
  handleCustomButton(buttonName, buttonIndex, gamepad) {
    // Override this method to handle custom button actions
    console.log(`Custom button handler: ${buttonName}`);
  }
  
  dispatchControllerEvent(eventType, detail) {
    const event = new CustomEvent(`controller-${eventType}`, {
      detail: detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }
  
  // Public methods
  getConnectedGamepads() {
    return Object.keys(this.gamepads).map(index => this.gamepads[index]);
  }
  
  isGamepadConnected() {
    return Object.keys(this.gamepads).length > 0;
  }
}

// Initialize the controller navigator when the page loads
let controllerNav;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    controllerNav = new ControllerNavigator();
  });
} else {
  controllerNav = new ControllerNavigator();
}

// Export for external use
window.ControllerNavigator = ControllerNavigator;
window.controllerNav = controllerNav;