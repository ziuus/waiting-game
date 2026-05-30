// Mock data for display until Firebase is connected
const MOCK_DATA = {
    dino: [
        { username: "Zius", score: 2450, date: "2026-05-15" },
        { username: "NeonNinja", score: 1840, date: "2026-05-14" },
        { username: "Ghost", score: 1200, date: "2026-05-10" }
    ],
    flappy: [
        { username: "Zius", score: 145, date: "2026-05-15" },
        { username: "BirdWatcher", score: 89, date: "2026-05-12" }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.filters button');
    const tbody = document.getElementById('leaderboard-body');
    let currentGame = 'dino';

    // Hook up buttons
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentGame = e.target.dataset.game;
            loadLeaderboard(currentGame);
        });
    });

    // Initial load
    loadLeaderboard(currentGame);

    async function loadLeaderboard(gameMode) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #888;">Loading...</td></tr>`;

        try {
            if (window.db) {
                // Real Firebase fetch
                const scoresRef = window.collection(window.db, "wgame_high_scores");
                const q = window.query(
                    scoresRef, 
                    window.where("gameId", "==", gameMode),
                    window.orderBy("score", "desc"),
                    window.limit(100)
                );
                
                const snapshot = await window.getDocs(q);
                const data = [];
                snapshot.forEach(doc => data.push(doc.data()));
                renderTable(data);
            } else {
                // Fallback to Mock
                setTimeout(() => {
                    renderTable(MOCK_DATA[gameMode] || []);
                }, 500);
            }
        } catch (error) {
            console.error("Error fetching scores:", error);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #ff4b2b;">Failed to load ranks. Configure Firebase to connect live data.</td></tr>`;
        }
    }

    function renderTable(data) {
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #888;">No scores yet. Be the first!</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((entry, index) => `
            <tr>
                <td class="rank-col">
                    <span class="rank-badge">${index + 1}</span>
                </td>
                <td class="name-col">${escapeHtml(entry.username || 'Anonymous')}</td>
                <td class="score-col">${entry.score.toString().padStart(5, '0')}</td>
                <td class="date-col">${formatDate(entry.date || entry.timestamp)}</td>
            </tr>
        `).join('');
    }

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function formatDate(timestamp) {
        if (!timestamp) return "Unknown";
        if (timestamp.toDate) {
            // Firebase Timestamp
            return timestamp.toDate().toLocaleDateString();
        }
        return new Date(timestamp).toLocaleDateString();
    }
});