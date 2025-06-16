// test-app.js - Minimal test to debug issues
console.log('🔍 Loading test app...');

// Test 1: Basic script loading
console.log('✅ Test 1 passed: Script is loading');

// Test 2: Can we import modules?
try {
    const { pubSub } = await import('./events/PubSub.js');
    console.log('✅ Test 2 passed: PubSub imported successfully');
    
    // Test 3: Can we create and use PubSub?
    const testSubscriber = pubSub.subscribe('test:event', (data) => {
        console.log('✅ Test 3 passed: PubSub is working', data);
    });
    
    pubSub.publish('test:event', { message: 'Hello from test!' });
    
    // Test 4: Can we import other modules?
    const { appState } = await import('./core/AppState.js');
    console.log('✅ Test 4 passed: AppState imported successfully');
    
    // Test 5: Can we use AppState?
    appState.set('test', 'value');
    const testValue = appState.get('test');
    console.log('✅ Test 5 passed: AppState is working', testValue);
    
    // Test 6: Can we import UI components?
    const { uiManager } = await import('./ui/UIManager.js');
    console.log('✅ Test 6 passed: UIManager imported successfully');
    
    console.log('🎉 All tests passed! The issue might be in the app initialization.');
    
} catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
}
