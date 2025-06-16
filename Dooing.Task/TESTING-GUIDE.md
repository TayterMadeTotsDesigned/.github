# Dooing.Task Manual Testing Checklist

## Testing the Refactored App

To test the refactored Dooing.Task application, open http://localhost:8000 and follow these steps:

### 1. Module Loading Test
- Open browser console (F12)
- Check for any red error messages
- Run: `window.appState && window.pubSub && window.uiManager` - should return a truthy value
- Look for green initialization messages in console

### 2. Sidebar Functionality
- [ ] Click the hamburger menu (☰) button in top-right corner
- [ ] Sidebar should slide in from the right
- [ ] Click the backdrop (dark area) to close sidebar
- [ ] Sidebar should slide out
- [ ] Click close button (×) in sidebar to close

### 3. Navigation Buttons
- [ ] Click left arrow (←) in header
- [ ] Date should change to previous day
- [ ] Click right arrow (→) in header  
- [ ] Date should change to next day
- [ ] Navigation should be smooth and responsive

### 4. Add Task Functionality
- [ ] Click the "+" button in header
- [ ] Task creation modal should open
- [ ] Click outside modal or close button to close
- [ ] Modal should close properly

### 5. Settings & Help Buttons (New!)
- [ ] Open sidebar and click "Settings" button
- [ ] Settings modal should open with theme, pomodoro, and notification options
- [ ] Close settings modal
- [ ] Open sidebar and click "Help" button
- [ ] Help modal should open with keyboard shortcuts and tips
- [ ] Close help modal

### 6. General UI Responsiveness
- [ ] All buttons should have hover effects
- [ ] Clicking should provide visual feedback
- [ ] No broken layouts or overlapping elements
- [ ] Theme should be consistent across all components

### 7. Console Error Check
- [ ] Open browser console
- [ ] Refresh the page
- [ ] Look for any red error messages
- [ ] No JavaScript errors should appear

### 8. Task Operations (If working)
- [ ] Try creating a new task
- [ ] Try editing an existing task
- [ ] Try marking a task as complete
- [ ] Try deleting a task

### 9. Calendar Navigation
- [ ] Try switching between different views (today, tomorrow, calendar)
- [ ] Navigation should work smoothly
- [ ] Date display should update correctly

### 10. Pomodoro Timer (If working)
- [ ] Try starting a pomodoro session
- [ ] Timer should count down
- [ ] Controls should be responsive

## Quick Console Tests

Paste this in browser console for automated testing:

```javascript
// Load the test script
const script = document.createElement('script');
script.src = 'scripts/browser-test.js';
document.head.appendChild(script);
```

Or run quick checks:

```javascript
// Quick module check
console.log('Modules loaded:', {
  appState: !!window.appState,
  pubSub: !!window.pubSub,
  uiManager: !!window.uiManager,
  taskManager: !!window.taskManager
});

// Quick button check
console.log('Buttons found:', {
  sidebar: !!document.querySelector('[data-action="toggle-sidebar"]'),
  addTask: !!document.querySelector('[data-action="add-task"]'),
  settings: !!document.querySelector('[data-action="show-settings"]'),
  help: !!document.querySelector('[data-action="show-help"]'),
  navPrev: !!document.querySelector('[data-action="navigate-prev"]'),
  navNext: !!document.querySelector('[data-action="navigate-next"]')
});
```

## Expected Results

✅ **Success indicators:**
- No console errors
- All buttons respond to clicks
- Sidebar opens/closes smoothly
- Modals open/close properly
- Navigation changes dates
- Settings and Help modals display content

❌ **Failure indicators:**
- Red console errors
- Buttons don't respond
- UI elements don't appear
- Broken layouts
- Missing functionality

## Troubleshooting

If something doesn't work:

1. Check browser console for errors
2. Verify the local server is running on port 8000
3. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)
4. Check if files were saved properly
5. Verify all modules are loading in the correct order
