// simple-test.js - Ultra simple test
console.log('🟢 Simple test is working!');
alert('If you see this alert, JavaScript is working!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM is loaded!');
    document.body.style.backgroundColor = 'lightgreen';
    
    // Try to find an element
    const header = document.querySelector('.header');
    if (header) {
        console.log('🟢 Found header element!');
        header.style.border = '3px solid red';
    } else {
        console.log('🔴 Could not find header element!');
    }
});
