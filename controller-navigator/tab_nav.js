// Controller Navigation using HTML5 Gamepad API
class ControllerNavigator {
  constructor() {
    this.gamepads = {};
    this.previousButtonStates = {};
    this.previousAnalogStates = {};
    this.previousDPadStates = {};
    this.isPolling = false;
    
    // Controller profiles for handling mapping quirks
    this.controllerProfiles = {
      '8BitDo Ultimate 2C': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Skip axis 2 (left trigger)
          leftTrigger: 2, rightTrigger: 5
        },
        buttonMap: {
          0: 'A',           
          1: 'B',           
          2: 'X',           
          3: 'Y',           
          4: 'LB',          
          5: 'RB',          
          6: 'Select',          
          7: 'Start',          
          8: 'Home',      
          9: 'LS',       
          10: 'RS',         
          11: '',         
          12: 'DPadUp',     
          13: 'DPadDown',   
          14: 'DPadLeft',   
          15: 'DPadRight',  
          16: ''        
        }
      },
      '8BitDo SN30 Pro': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Skip axis 2 (left trigger)
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'Xbox One Controller': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Skip axis 2 (left trigger)
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'Xbox Series X Controller': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Skip axis 2 (left trigger)
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'DualSense Controller': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 2, rightY: 3,  // PS5 controllers typically don't interfere
          leftTrigger: null, rightTrigger: null
        }
      },
      'DUALSHOCK 4': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 2, rightY: 3,  // PS4 controllers typically don't interfere
          leftTrigger: null, rightTrigger: null
        }
      },
      'Pro Controller': {  // Nintendo Switch Pro Controller
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Skip axis 2 (left trigger)
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'Joy-Con': {  // Nintendo Switch Joy-Con
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 2, rightY: 3,  // Joy-Con typically standard mapping
          leftTrigger: null, rightTrigger: null
        }
      },
      'PowerA': {  // PowerA third-party controllers
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Many PowerA controllers skip axis 2
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'PDP': {  // PDP (Performance Designed Products) controllers
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // PDP controllers often skip axis 2
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'Razer': {  // Razer controllers (Wolverine series)
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Skip axis 2 (left trigger)
          leftTrigger: 2, rightTrigger: 5
        }
      },
      'Steam Controller': {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 3, rightY: 4,  // Steam Controller axis mapping
          leftTrigger: 2, rightTrigger: 5
        }
      },
      // Add more profiles as needed
      default: {
        axesMap: {
          leftX: 0, leftY: 1,
          rightX: 2, rightY: 3,
          leftTrigger: null, rightTrigger: null
        }
      }
    };
    
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
    
    // Default action mappings - can be overridden by user settings
    this.actionMappings = {
      0: 'enter',       // A button - Enter/Click
      1: 'escape',      // B button - Escape/Back
      4: 'shift-tab',   // LB button - Shift+Tab
      5: 'tab',         // RB button - Tab
      12: 'arrow-up',   // D-pad Up
      13: 'arrow-down', // D-pad Down
      14: 'arrow-left', // D-pad Left
      15: 'arrow-right' // D-pad Right
    };
    
    this.loadUserSettings();
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
    
    // Listen for settings updates from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateMappings') {
        this.actionMappings = request.mappings;
        this.saveUserSettings();
        sendResponse({ success: true });
      } else if (request.action === 'getMappings') {
        // Get current controller's button map if available
        const gamepads = navigator.getGamepads();
        let buttonMap = this.buttonMap;
        
        for (let gamepad of gamepads) {
          if (gamepad) {
            const profile = this.getControllerProfile(gamepad);
            if (profile.buttonMap) {
              buttonMap = profile.buttonMap;
              break;
            }
          }
        }
        
        sendResponse({ mappings: this.actionMappings, buttonMap: buttonMap });
      }
    });
    
    // Start polling for existing gamepads
    this.startPolling();
    
    console.log('Controller Navigator initialized');
  }
  
  onGamepadConnected(event) {
    const gamepad = event.gamepad;
    console.log(`Gamepad connected: ${gamepad.id} (${gamepad.index})`);
    console.log(`Buttons: ${gamepad.buttons.length}, Axes: ${gamepad.axes.length}`);
    this.gamepads[gamepad.index] = gamepad;
    this.previousButtonStates[gamepad.index] = [];
    this.previousAnalogStates[gamepad.index] = {
      leftX: 0, leftY: 0, rightX: 0, rightY: 0
    };
    this.previousDPadStates[gamepad.index] = {
      up: false, down: false, left: false, right: false
    };
  }
  
  // Get controller profile for axes mapping
  getControllerProfile(gamepad) {
    // Check if we have a specific profile for this controller
    for (const profileName in this.controllerProfiles) {
      if (gamepad.id.includes(profileName)) {
        return this.controllerProfiles[profileName];
      }
    }
    return this.controllerProfiles.default;
  }
  
  onGamepadDisconnected(event) {
    const gamepad = event.gamepad;
    console.log(`Gamepad disconnected: ${gamepad.id} (${gamepad.index})`);
    delete this.gamepads[gamepad.index];
    delete this.previousButtonStates[gamepad.index];
    delete this.previousAnalogStates[gamepad.index];
    delete this.previousDPadStates[gamepad.index];
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
    if (!this.previousDPadStates[index]) {
      this.previousDPadStates[index] = {
        up: false, down: false, left: false, right: false
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
    
    // Process D-pad (both button and axes methods)
    this.processDPad(gamepad);
    
    // Process analog sticks
    this.processAnalogSticks(gamepad);
  }
  
  onButtonPressed(gamepad, buttonIndex, button) {
    // Use controller-specific button mapping if available
    const profile = this.getControllerProfile(gamepad);
    const buttonMap = profile.buttonMap || this.buttonMap;
    const buttonName = buttonMap[buttonIndex] || `Button${buttonIndex}`;
    
    console.log(`Button pressed: ${buttonName} (${buttonIndex}) on gamepad ${gamepad.index} (${gamepad.id})`);
    
    // Get the action assigned to this button
    const action = this.actionMappings[buttonIndex];
    
    if (action) {
      this.executeAction(action);
    } else {
      // Custom handler for unmapped buttons
      this.handleCustomButton(buttonName, buttonIndex, gamepad);
    }
    
    // Dispatch custom event
    this.dispatchControllerEvent('buttonpress', {
      gamepad: gamepad,
      button: buttonIndex,
      buttonName: buttonName,
      action: action,
      value: button.value
    });
  }
  
  onButtonReleased(gamepad, buttonIndex, button) {
    // Use controller-specific button mapping if available
    const profile = this.getControllerProfile(gamepad);
    const buttonMap = profile.buttonMap || this.buttonMap;
    const buttonName = buttonMap[buttonIndex] || `Button${buttonIndex}`;
    
    console.log(`Button released: ${buttonName} (${buttonIndex}) on gamepad ${gamepad.index} (${gamepad.id})`);
    
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
    const profile = this.getControllerProfile(gamepad);
    const axesMap = profile.axesMap;
    
    // Get stick values using profile mapping
    const leftX = gamepad.axes[axesMap.leftX] || 0;
    const leftY = gamepad.axes[axesMap.leftY] || 0;
    const rightX = gamepad.axes[axesMap.rightX] || 0;
    const rightY = gamepad.axes[axesMap.rightY] || 0;
    
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
  
  // Process D-pad input (supports both button and axes methods)
  processDPad(gamepad) {
    const index = gamepad.index;
    const prevDPad = this.previousDPadStates[index];
    
    let dpadUp = false, dpadDown = false, dpadLeft = false, dpadRight = false;
    
    // Method 1: Check standard D-pad button indices (12-15)
    if (gamepad.buttons.length > 15) {
      dpadUp = gamepad.buttons[12] && gamepad.buttons[12].pressed;
      dpadDown = gamepad.buttons[13] && gamepad.buttons[13].pressed;
      dpadLeft = gamepad.buttons[14] && gamepad.buttons[14].pressed;
      dpadRight = gamepad.buttons[15] && gamepad.buttons[15].pressed;
    }
    
    // Method 2: Check D-pad axes (usually axes 6 and 7 on some controllers)
    if (!dpadUp && !dpadDown && !dpadLeft && !dpadRight && gamepad.axes.length >= 8) {
      const dpadXAxis = gamepad.axes[6];
      const dpadYAxis = gamepad.axes[7];
      
      if (dpadXAxis !== undefined && dpadYAxis !== undefined) {
        dpadLeft = dpadXAxis < -0.5;
        dpadRight = dpadXAxis > 0.5;
        dpadUp = dpadYAxis < -0.5;
        dpadDown = dpadYAxis > 0.5;
      }
    }
    
    // Method 3: Alternative axes positions (some controllers use different indices)
    if (!dpadUp && !dpadDown && !dpadLeft && !dpadRight && gamepad.axes.length >= 10) {
      const dpadXAxis = gamepad.axes[8];
      const dpadYAxis = gamepad.axes[9];
      
      if (dpadXAxis !== undefined && dpadYAxis !== undefined) {
        dpadLeft = dpadXAxis < -0.5;
        dpadRight = dpadXAxis > 0.5;
        dpadUp = dpadYAxis < -0.5;
        dpadDown = dpadYAxis > 0.5;
      }
    }
    
    // Debug logging for D-pad detection
    if (dpadUp || dpadDown || dpadLeft || dpadRight) {
      console.log(`D-pad detected: Up:${dpadUp}, Down:${dpadDown}, Left:${dpadLeft}, Right:${dpadRight}`);
    }
    
    // Handle D-pad presses (only trigger on new press, not hold)
    if (dpadUp && !prevDPad.up) {
      console.log('D-pad Up pressed');
      this.onDPadPressed('up');
    }
    if (dpadDown && !prevDPad.down) {
      console.log('D-pad Down pressed');
      this.onDPadPressed('down');
    }
    if (dpadLeft && !prevDPad.left) {
      console.log('D-pad Left pressed');
      this.onDPadPressed('left');
    }
    if (dpadRight && !prevDPad.right) {
      console.log('D-pad Right pressed');
      this.onDPadPressed('right');
    }
    
    // Update previous states
    prevDPad.up = dpadUp;
    prevDPad.down = dpadDown;
    prevDPad.left = dpadLeft;
    prevDPad.right = dpadRight;
  }
  
  // Handle D-pad press events
  onDPadPressed(direction) {
    const directionToButton = {
      'up': 12,
      'down': 13,
      'left': 14,
      'right': 15
    };
    
    const buttonIndex = directionToButton[direction];
    const action = this.actionMappings[buttonIndex];
    
    if (action) {
      console.log(`Executing D-pad ${direction} action: ${action}`);
      this.executeAction(action);
    } else {
      console.log(`No action mapped for D-pad ${direction}`);
    }
    
    // Dispatch custom event
    this.dispatchControllerEvent('dpadpress', {
      direction: direction,
      button: buttonIndex,
      action: action
    });
  }
  
  handleAnalogNavigation(x, y, stickName) {
    // Implement analog stick navigation logic here
    // This could be used for smooth scrolling or cursor movement
    console.log(`${stickName} movement: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
  }
  
  // Execute action based on user mapping
  executeAction(action) {
    switch (action) {
      case 'enter':
        this.simulateEnterKey();
        break;
      case 'escape':
        this.simulateEscapeKey();
        break;
      case 'tab':
        this.simulateTabKey();
        break;
      case 'shift-tab':
        this.simulateShiftTabKey();
        break;
      case 'arrow-up':
        this.navigateUp();
        break;
      case 'arrow-down':
        this.navigateDown();
        break;
      case 'arrow-left':
        this.navigateLeft();
        break;
      case 'arrow-right':
        this.navigateRight();
        break;
      case 'space':
        this.dispatchKeyEvent('Space', 32);
        break;
      case 'backspace':
        this.dispatchKeyEvent('Backspace', 8);
        break;
      case 'delete':
        this.dispatchKeyEvent('Delete', 46);
        break;
      case 'home':
        this.dispatchKeyEvent('Home', 36);
        break;
      case 'end':
        this.dispatchKeyEvent('End', 35);
        break;
      case 'page-up':
        this.dispatchKeyEvent('PageUp', 33);
        break;
      case 'page-down':
        this.dispatchKeyEvent('PageDown', 34);
        break;
      case 'none':
        // Do nothing
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }
  
  // Settings management
  loadUserSettings() {
    try {
      const saved = localStorage.getItem('controllerNavigatorMappings');
      if (saved) {
        this.actionMappings = { ...this.actionMappings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load user settings:', error);
    }
  }
  
  saveUserSettings() {
    try {
      localStorage.setItem('controllerNavigatorMappings', JSON.stringify(this.actionMappings));
    } catch (error) {
      console.warn('Failed to save user settings:', error);
    }
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