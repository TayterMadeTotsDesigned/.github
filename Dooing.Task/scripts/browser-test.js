// Browser Console Test Script for Dooing.Task App
// Run this in the browser console to test all functionality

console.log('🧪 Starting Dooing.Task Browser Tests...');

// Test 1: Check if all modules are loaded
function testModuleLoading() {
    console.log('\n1️⃣ Testing Module Loading...');
    
    const modules = [
        'window.appState',
        'window.pubSub', 
        'window.storageService',
        'window.dateService',
        'window.taskManager',
        'window.pomodoroManager',
        'window.domEventManager',
        'window.uiManager'
    ];
    
    modules.forEach(module => {
        const exists = eval(module);
        console.log(`${exists ? '✅' : '❌'} ${module}: ${exists ? 'loaded' : 'missing'}`);
    });
}

// Test 2: Check sidebar functionality
function testSidebar() {
    console.log('\n2️⃣ Testing Sidebar...');
    
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    const hamburgerBtn = document.querySelector('[data-action="toggle-sidebar"]');
    
    console.log(`✅ Sidebar element: ${sidebar ? 'found' : 'missing'}`);
    console.log(`✅ Backdrop element: ${backdrop ? 'found' : 'missing'}`);
    console.log(`✅ Hamburger button: ${hamburgerBtn ? 'found' : 'missing'}`);
    
    if (hamburgerBtn) {
        console.log('🔄 Testing sidebar toggle...');
        hamburgerBtn.click();
        setTimeout(() => {
            const isOpen = sidebar.classList.contains('open');
            console.log(`${isOpen ? '✅' : '❌'} Sidebar opened: ${isOpen}`);
            
            // Close it
            if (backdrop) {
                backdrop.click();
                setTimeout(() => {
                    const isClosed = !sidebar.classList.contains('open');
                    console.log(`${isClosed ? '✅' : '❌'} Sidebar closed: ${isClosed}`);
                }, 100);
            }
        }, 100);
    }
}

// Test 3: Check navigation buttons
function testNavigation() {
    console.log('\n3️⃣ Testing Navigation...');
    
    const prevBtn = document.querySelector('[data-action="navigate-prev"]');
    const nextBtn = document.querySelector('[data-action="navigate-next"]');
    
    console.log(`✅ Previous button: ${prevBtn ? 'found' : 'missing'}`);
    console.log(`✅ Next button: ${nextBtn ? 'found' : 'missing'}`);
    
    if (prevBtn && nextBtn) {
        console.log('🔄 Testing navigation...');
        const initialDate = window.appState ? window.appState.getCurrentDate() : 'unknown';
        console.log(`📅 Initial date: ${initialDate}`);
        
        // Test next
        nextBtn.click();
        setTimeout(() => {
            const newDate = window.appState ? window.appState.getCurrentDate() : 'unknown';
            console.log(`📅 After next: ${newDate}`);
            
            // Test previous
            prevBtn.click();
            setTimeout(() => {
                const backDate = window.appState ? window.appState.getCurrentDate() : 'unknown';
                console.log(`📅 After previous: ${backDate}`);
            }, 100);
        }, 100);
    }
}

// Test 4: Check add task button and other buttons
function testButtons() {
    console.log('\n4️⃣ Testing Buttons...');
    
    const addTaskBtn = document.querySelector('[data-action="add-task"]');
    const settingsBtn = document.querySelector('[data-action="show-settings"]');
    const helpBtn = document.querySelector('[data-action="show-help"]');
    
    console.log(`✅ Add task button: ${addTaskBtn ? 'found' : 'missing'}`);
    console.log(`✅ Settings button: ${settingsBtn ? 'found' : 'missing'}`);
    console.log(`✅ Help button: ${helpBtn ? 'found' : 'missing'}`);
    
    if (addTaskBtn) {
        console.log('🔄 Testing add task modal...');
        addTaskBtn.click();
        setTimeout(() => {
            const modal = document.querySelector('.modal');
            const isModalOpen = modal && modal.style.display !== 'none';
            console.log(`${isModalOpen ? '✅' : '❌'} Task modal opened: ${isModalOpen}`);
            
            // Close modal if open
            if (isModalOpen) {
                const closeBtn = modal.querySelector('.close');
                if (closeBtn) {
                    closeBtn.click();
                    setTimeout(() => {
                        const isModalClosed = modal.style.display === 'none';
                        console.log(`${isModalClosed ? '✅' : '❌'} Task modal closed: ${isModalClosed}`);
                    }, 100);
                }
            }
        }, 100);
    }
    
    if (settingsBtn) {
        console.log('🔄 Testing settings modal...');
        setTimeout(() => {
            settingsBtn.click();
            setTimeout(() => {
                const modal = document.querySelector('.modal');
                const isModalOpen = modal && modal.style.display !== 'none';
                const isSettingsModal = modal && modal.textContent.includes('Settings');
                console.log(`${isModalOpen && isSettingsModal ? '✅' : '❌'} Settings modal opened: ${isModalOpen && isSettingsModal}`);
                
                if (isModalOpen) {
                    const closeBtn = modal.querySelector('[data-action="close-modal"]') || modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }, 100);
        }, 1000);
    }
    
    if (helpBtn) {
        console.log('🔄 Testing help modal...');
        setTimeout(() => {
            helpBtn.click();
            setTimeout(() => {
                const modal = document.querySelector('.modal');
                const isModalOpen = modal && modal.style.display !== 'none';
                const isHelpModal = modal && modal.textContent.includes('Help');
                console.log(`${isModalOpen && isHelpModal ? '✅' : '❌'} Help modal opened: ${isModalOpen && isHelpModal}`);
                
                if (isModalOpen) {
                    const closeBtn = modal.querySelector('[data-action="close-modal"]') || modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }, 100);
        }, 1500);
    }
}

// Test 5: Check for console errors
function checkConsoleErrors() {
    console.log('\n5️⃣ Checking for Errors...');
    
    // Override console.error to catch errors
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
        errorCount++;
        originalError.apply(console, ['❌ Error caught:', ...args]);
    };
    
    setTimeout(() => {
        console.log(`📊 Total errors caught: ${errorCount}`);
        console.error = originalError; // Restore original
    }, 1000);
}

// Run all tests
function runAllTests() {
    testModuleLoading();
    
    setTimeout(() => {
        testSidebar();
    }, 500);
    
    setTimeout(() => {
        testNavigation();
    }, 1500);
    
    setTimeout(() => {
        testButtons();
    }, 2500);
    
    setTimeout(() => {
        checkConsoleErrors();
        console.log('\n🎉 All tests completed! Check the results above.');
    }, 4000);
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.dooingTests = {
    runAllTests,
    testModuleLoading,
    testSidebar,
    testNavigation,
    testButtons,
    checkConsoleErrors
};

console.log('\n💡 You can also run individual tests: window.dooingTests.testSidebar()');
