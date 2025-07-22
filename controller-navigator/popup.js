// Popup script for Controller Navigator extension
document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  
  // Check if gamepad API is supported
  if (!navigator.getGamepads) {
    statusElement.textContent = 'Gamepad API not supported';
    statusElement.style.backgroundColor = '#ffe8e8';
    statusElement.style.color = '#5a2d2d';
    return;
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
  
  // Listen for gamepad events
  window.addEventListener('gamepadconnected', checkGamepadStatus);
  window.addEventListener('gamepaddisconnected', checkGamepadStatus);
  
  // Periodic check for controllers (some browsers need this)
  setInterval(checkGamepadStatus, 1000);
});
