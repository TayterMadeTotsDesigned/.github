// Quick Test - Check for basic functionality and errors

console.log('🔍 Quick test starting...');

// Check global objects are available
const globals = ['appState', 'pubSub', 'taskManager', 'uiManager'];
globals.forEach(g => {
    console.log(`${window[g] ? '✅' : '❌'} ${g}:`, window[g] ? 'loaded' : 'missing');
});

// Test sidebar toggle
const sidebarBtn = document.querySelector('[data-action="toggle-sidebar"]');
console.log(`${sidebarBtn ? '✅' : '❌'} Sidebar button:`, sidebarBtn ? 'found' : 'missing');

if (sidebarBtn) {
    console.log('Testing sidebar...');
    sidebarBtn.click();
    setTimeout(() => {
        const sidebar = document.querySelector('.sidebar');
        console.log(`${sidebar ? '✅' : '❌'} Sidebar toggle:`, sidebar ? sidebar.classList.contains('open') : 'no sidebar');
    }, 100);
}

// Test add task button
const addTaskBtn = document.querySelector('[data-action="add-task"]');
console.log(`${addTaskBtn ? '✅' : '❌'} Add task button:`, addTaskBtn ? 'found' : 'missing');

// Test settings and help buttons
const settingsBtn = document.querySelector('[data-action="show-settings"]');
const helpBtn = document.querySelector('[data-action="show-help"]');
console.log(`${settingsBtn ? '✅' : '❌'} Settings button:`, settingsBtn ? 'found' : 'missing');
console.log(`${helpBtn ? '✅' : '❌'} Help button:`, helpBtn ? 'found' : 'missing');

console.log('🔍 Quick test completed!');
