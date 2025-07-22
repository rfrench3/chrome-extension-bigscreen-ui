// Popup script for Controller Navigator extension
document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  let currentMappings = {};
  let buttonMap = {};
  
  // Available actions
  const availableActions = {
    'none': 'No Action',
    'enter': 'Enter/Click',
    'escape': 'Escape/Back',
    'tab': 'Tab (Forward)',
    'shift-tab': 'Shift+Tab (Backward)',
    'arrow-up': 'Arrow Up',
    'arrow-down': 'Arrow Down',
    'arrow-left': 'Arrow Left',
    'arrow-right': 'Arrow Right',
    'space': 'Space',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'home': 'Home',
    'end': 'End',
    'page-up': 'Page Up',
    'page-down': 'Page Down'
  };
  
  // Check if gamepad API is supported
  if (!navigator.getGamepads) {
    statusElement.textContent = 'Gamepad API not supported';
    statusElement.style.backgroundColor = '#ffe8e8';
    statusElement.style.color = '#5a2d2d';
    return;
  }
  
  // Load current mappings from content script
  function loadMappings() {
    // Set a timeout to show fallback if content script doesn't respond
    const timeoutId = setTimeout(() => {
      console.warn('Content script timeout, using default mappings');
      loadDefaultMappings();
    }, 2000);
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (chrome.runtime.lastError) {
        console.error('Chrome tabs query error:', chrome.runtime.lastError);
        clearTimeout(timeoutId);
        showMappingError('Failed to connect to active tab');
        return;
      }
      
      if (!tabs || tabs.length === 0) {
        clearTimeout(timeoutId);
        showMappingError('No active tab found');
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getMappings' }, function(response) {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          console.error('Chrome messaging error:', chrome.runtime.lastError);
          showMappingError('Extension not loaded on this page. Please refresh the page.');
          return;
        }
        
        if (response && response.mappings && response.buttonMap) {
          currentMappings = response.mappings;
          buttonMap = response.buttonMap;
          createMappingInterface();
        } else {
          console.warn('Invalid response from content script, using defaults');
          loadDefaultMappings();
        }
      });
    });
  }
  
  // Load default mappings as fallback
  function loadDefaultMappings() {
    // Default button map
    buttonMap = {
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
    
    // Default action mappings
    currentMappings = {
      0: 'enter',       // A button - Enter/Click
      1: 'escape',      // B button - Escape/Back
      4: 'shift-tab',   // LB button - Shift+Tab
      5: 'tab',         // RB button - Tab
      12: 'arrow-up',   // D-pad Up
      13: 'arrow-down', // D-pad Down
      14: 'arrow-left', // D-pad Left
      15: 'arrow-right' // D-pad Right
    };
    
    createMappingInterface();
  }
  
  // Show error message in mapping area
  function showMappingError(message) {
    const container = document.getElementById('mappings-section');
    if (!container) {
      console.error('Could not find mapping container element');
      return;
    }
    container.innerHTML = `
      <h3>Button Mappings:</h3>
      <div style="text-align: center; color: #dc3545; font-style: italic; padding: 16px;">
        ${message}
      </div>
    `;
  }
  
  // Create the mapping interface
  function createMappingInterface() {
    const container = document.getElementById('mappings-section');
    if (!container) {
      console.error('Could not find mapping container element');
      return;
    }
    container.innerHTML = '<h3>Button Mappings:</h3>';
    
    // Create mapping controls for each button
    Object.keys(buttonMap).forEach(buttonIndex => {
      const buttonNumber = parseInt(buttonIndex);
      const buttonName = buttonMap[buttonIndex];
      const currentAction = currentMappings[buttonNumber] || 'none';
      
      const mappingDiv = document.createElement('div');
      mappingDiv.className = 'button-mapping';
      mappingDiv.innerHTML = `
        <span class="button-name">${buttonName}</span>
        <select class="action-select" data-button="${buttonNumber}">
          ${Object.keys(availableActions).map(action => 
            `<option value="${action}" ${action === currentAction ? 'selected' : ''}>
              ${availableActions[action]}
            </option>`
          ).join('')}
        </select>
      `;
      
      container.appendChild(mappingDiv);
    });
    
    // Add save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Mappings';
    saveButton.className = 'save-button';
    saveButton.style.cssText = `
      width: 100%;
      padding: 12px;
      background-color: #007acc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 16px;
    `;
    saveButton.addEventListener('click', saveMappings);
    container.appendChild(saveButton);
    
    // Add event listeners to selects
    document.querySelectorAll('.action-select').forEach(select => {
      select.addEventListener('change', function() {
        const buttonIndex = parseInt(this.dataset.button);
        const action = this.value;
        currentMappings[buttonIndex] = action;
      });
    });
  }
  
  // Save mappings to content script
  function saveMappings() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        alert('Failed to save: No active tab found');
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'updateMappings', 
        mappings: currentMappings 
      }, function(response) {
        if (chrome.runtime.lastError) {
          alert('Failed to save: Extension not active on this page');
          return;
        }
        
        if (response && response.success) {
          // Show success feedback
          const saveButton = document.querySelector('.save-button');
          const originalText = saveButton.textContent;
          saveButton.textContent = 'Saved!';
          saveButton.style.backgroundColor = '#28a745';
          setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.backgroundColor = '#007acc';
          }, 1500);
        } else {
          alert('Failed to save mappings');
        }
      });
    });
  }
  
  // Check for connected gamepads
  function checkGamepadStatus() {
    const gamepads = navigator.getGamepads();
    let connectedCount = 0;
    
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        connectedCount++;
      }
    }
    
    if (connectedCount > 0) {
      statusElement.textContent = `${connectedCount} controller(s) connected`;
      statusElement.style.backgroundColor = '#e8f5e8';
      statusElement.style.color = '#2d5a2d';
    } else {
      statusElement.textContent = 'No controllers detected';
      statusElement.style.backgroundColor = '#fff3cd';
      statusElement.style.color = '#856404';
    }
  }
  
  // Initial check
  checkGamepadStatus();
  loadMappings();
  
  // Listen for gamepad events
  window.addEventListener('gamepadconnected', checkGamepadStatus);
  window.addEventListener('gamepaddisconnected', checkGamepadStatus);
  
  // Periodic check for controllers (some browsers need this)
  setInterval(checkGamepadStatus, 1000);
});
