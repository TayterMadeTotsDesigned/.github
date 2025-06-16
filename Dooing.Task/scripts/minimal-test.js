// minimal-test.js - Super minimal test
console.log('🔍 Minimal test starting...');

// Test if we can just import one module at a time
import('./events/PubSub.js')
    .then((module) => {
        console.log('✅ PubSub imported:', module);
        return import('./core/AppState.js');
    })
    .then((module) => {
        console.log('✅ AppState imported:', module);
        return import('./core/StorageService.js');
    })
    .then((module) => {
        console.log('✅ StorageService imported:', module);
        return import('./core/DateService.js');
    })
    .then((module) => {
        console.log('✅ DateService imported:', module);
        return import('./utils/helpers.js');
    })
    .then((module) => {
        console.log('✅ Helpers imported:', module);
        return import('./core/TaskManager.js');
    })
    .then((module) => {
        console.log('✅ TaskManager imported:', module);
        return import('./core/PomodoroManager.js');
    })
    .then((module) => {
        console.log('✅ PomodoroManager imported:', module);
        return import('./events/DomEventManager.js');
    })
    .then((module) => {
        console.log('✅ DomEventManager imported:', module);
        return import('./ui/renderers/TaskRenderer.js');
    })
    .then((module) => {
        console.log('✅ TaskRenderer imported:', module);
        return import('./ui/renderers/CalendarRenderer.js');
    })
    .then((module) => {
        console.log('✅ CalendarRenderer imported:', module);
        return import('./ui/renderers/PomodoroRenderer.js');
    })
    .then((module) => {
        console.log('✅ PomodoroRenderer imported:', module);
        return import('./ui/components/ModalManager.js');
    })
    .then((module) => {
        console.log('✅ ModalManager imported:', module);
        return import('./ui/components/ThemeManager.js');
    })
    .then((module) => {
        console.log('✅ ThemeManager imported:', module);
        return import('./ui/components/NotificationService.js');
    })
    .then((module) => {
        console.log('✅ NotificationService imported:', module);
        return import('./ui/UIManager.js');
    })
    .then((module) => {
        console.log('✅ UIManager imported:', module);
        console.log('🎉 All modules imported successfully!');
    })
    .catch((error) => {
        console.error('❌ Import failed:', error);
        console.error('Stack:', error.stack);
    });
