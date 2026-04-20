const { getCurrent } = window.__TAURI__.window;

document.getElementById('closeHub').addEventListener('click', () => {
    getCurrent().hide();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        getCurrent().hide();
    }
});

// Implementation of settings persistence will go here
const toggleScore = document.getElementById('toggleScore');
const toggleBoot = document.getElementById('toggleBoot');

toggleScore.addEventListener('change', (e) => {
    // TODO: Emit event to main window to hide/show score
    console.log('Score visibility:', e.target.checked);
});

toggleBoot.addEventListener('change', (e) => {
    // TODO: Handle startup logic
    console.log('Auto Start:', e.target.checked);
});
