// debug-app.js - Step by step debugging
console.log('🔍 Debug app starting...');

let step = 0;

function logStep(description) {
    step++;
    console.log(`Step ${step}: ${description}`);
}

async function testModules() {
    try {
        logStep('Testing PubSub import...');
        const { pubSub } = await import('./events/PubSub.js');
        console.log('✅ PubSub imported successfully');

        logStep('Testing AppState import...');
        const { appState } = await import('./core/AppState.js');
        console.log('✅ AppState imported successfully');

        logStep('Testing StorageService import...');
        const { storageService } = await import('./core/StorageService.js');
        console.log('✅ StorageService imported successfully');

        logStep('Testing TaskManager import...');
        const { taskManager } = await import('./core/TaskManager.js');
        console.log('✅ TaskManager imported successfully');

        logStep('Testing PomodoroManager import...');
        const { pomodoroManager } = await import('./core/PomodoroManager.js');
        console.log('✅ PomodoroManager imported successfully');

        logStep('Testing DomEventManager import...');
        const { domEventManager } = await import('./events/DomEventManager.js');
        console.log('✅ DomEventManager imported successfully');

        logStep('Testing UIManager import...');
        const { uiManager } = await import('./ui/UIManager.js');
        console.log('✅ UIManager imported successfully');

        // Now test initialization
        logStep('Testing UIManager initialization...');
        await uiManager.init();
        console.log('✅ UIManager initialized successfully');

        console.log('🎉 All tests passed! The modules are working correctly.');

    } catch (error) {
        console.error(`❌ Failed at step ${step}:`, error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testModules);
} else {
    testModules();
}
