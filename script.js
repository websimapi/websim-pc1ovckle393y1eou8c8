import { marked } from 'marked';
import DOMPurify from 'dompurify';

async function loadPremiumUsers() {
    try {
        const project = await window.websim.getCurrentProject();
        const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true`);
        const data = await response.json();
        
        const premiumUsers = data.comments.data
            .filter(comment => comment.comment.card_data?.type === 'tip_comment')
            .sort((a, b) => (b.comment.card_data.credits_spent || 0) - (a.comment.card_data.credits_spent || 0));
        
        displayUsers(premiumUsers);
        displayTickerUsers(premiumUsers);
    } catch (error) {
        console.error('Error loading premium users:', error);
        document.getElementById('premium-users').innerHTML = 
            '<div class="empty-state"><h4>Error Loading Users</h4><p>Unable to load premium users at this time.</p></div>';
    }
}

function displayUsers(users) {
    const container = document.getElementById('premium-users');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h4>No Premium Users Yet</h4>
                <p>Be the first to support this project!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(({ comment }) => {
        const credits = comment.card_data?.credits_spent || 0;
        const avatarUrl = comment.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.display_name || comment.author.username)}&background=667eea&color=fff`;
        
        return `
            <div class="user-card">
                <div class="user-header">
                    <img class="user-avatar" src="${avatarUrl}" alt="${comment.author.display_name || comment.author.username}">
                    <div class="user-info">
                        <div class="user-name">${comment.author.display_name || comment.author.username}</div>
                        <span class="credits-badge">${credits} Credits</span>
                    </div>
                </div>
                <div class="user-comment">
                    ${DOMPurify.sanitize(marked.parse(comment.raw_content || 'Thanks for the support!'))}
                </div>
            </div>
        `;
    }).join('');
}

function displayTickerUsers(users) {
    const tickerContainer = document.getElementById('ticker-users');
    
    if (users.length === 0) {
        tickerContainer.innerHTML = '<span class="ticker-user">Become the first Premium supporter! 💎</span>';
        return;
    }
    
    // Create a longer list by duplicating the users for smooth scrolling
    const duplicatedUsers = [...users, ...users];
    
    tickerContainer.innerHTML = duplicatedUsers.map(({ comment }) => {
        const credits = comment.card_data?.credits_spent || 0;
        const avatarUrl = comment.author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.display_name || comment.author.username)}&background=667eea&color=fff`;
        
        return `
            <div class="ticker-user">
                <img src="${avatarUrl}" alt="${comment.author.display_name || comment.author.username}">
                <span>${comment.author.display_name || comment.author.username}</span>
                <span class="ticker-credits">${credits} credits</span>
            </div>
        `;
    }).join('');
}

async function handleBecomePremium() {
    try {
        const result = await window.websim.postComment({
            content: "I'm proud to become a Premium supporter! Here's my 10 credit donation to support this amazing project. 💎"
        });
        
        if (result.error) {
            alert('Please interact with the page first before posting.');
        } else {
            // Reload the users list after a short delay
            setTimeout(loadPremiumUsers, 1000);
        }
    } catch (error) {
        console.error('Error posting premium comment:', error);
    }
}

// Load users on page load
loadPremiumUsers();

// Listen for new premium users in real-time
window.websim.addEventListener('comment:created', (data) => {
    if (data.comment.card_data?.type === 'tip_comment') {
        loadPremiumUsers();
    }
});

// Make handleBecomePremium globally accessible
window.handleBecomePremium = handleBecomePremium;