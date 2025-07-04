// L¶ê\·¹Æà - JavaScriptÕ¡¤ë

document.addEventListener('DOMContentLoaded', function() {
    // êÕÝX_ýn
    initAutoSave();
    
    // Õ©üàán2b
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });
});

// êÕÝX_ý
function initAutoSave() {
    const answerTextarea = document.getElementById('answer');
    const saveStatus = document.getElementById('saveStatus');
    const questionId = document.getElementById('questionId');
    
    if (!answerTextarea || !questionId) return;
    
    let saveTimeout;
    let lastSavedContent = answerTextarea.value;
    
    // Æ­¹È¨ê¢n	ô’ã–
    answerTextarea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        
        // …¹L	ôUŒfDjD4oÝXWjD
        if (this.value === lastSavedContent) return;
        
        // ÝX-nh:
        showSaveStatus('saving', 'ÝX-...');
        
        // 1ÒŒkêÕÝX
        saveTimeout = setTimeout(() => {
            saveAnswer(questionId.value, this.value);
        }, 1000);
    });
    
    // ÞT’ÝXY‹¢p
    async function saveAnswer(qId, answer) {
        try {
            const response = await fetch('api.php?action=save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: qId,
                    answer: answer
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                lastSavedContent = answer;
                showSaveStatus('saved', 'ÝXW~W_');
                
                // 3ÒŒkÝXáÃ»ü¸’^h:
                setTimeout(() => {
                    hideSaveStatus();
                }, 3000);
            } else {
                throw new Error(data.error || 'ÝXk1WW~W_');
            }
        } catch (error) {
            console.error('Save error:', error);
            showSaveStatus('error', '¨éü: ' + error.message);
        }
    }
    
    // ÝX¶K’h:Y‹¢p
    function showSaveStatus(type, message) {
        if (!saveStatus) return;
        
        saveStatus.className = 'alert alert-' + 
            (type === 'saved' ? 'success' : type === 'error' ? 'danger' : 'info');
        saveStatus.textContent = message;
        saveStatus.classList.remove('d-none');
    }
    
    // ÝX¶K’^h:kY‹¢p
    function hideSaveStatus() {
        if (!saveStatus) return;
        saveStatus.classList.add('d-none');
    }
}

// Õ¡¤ë¢Ã×íüÉ_ý
function uploadFile(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // ¢Ã×íüÉæ
    fetch('api.php?action=upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Õ¡¤ëL¢Ã×íüÉUŒ~W_: ' + data.filename);
        } else {
            throw new Error(data.error || '¢Ã×íüÉk1WW~W_');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        alert('¨éü: ' + error.message);
    });
}

// Çü¿¨¯¹ÝüÈ_ý
function exportData(format) {
    window.location.href = 'api.php?action=export&format=' + format;
}

// 2WÇü¿nÖ—
async function fetchProgress() {
    try {
        const response = await fetch('api.php?action=progress');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Progress fetch error:', error);
        return null;
    }
}

// Úü¸wûBnº
window.addEventListener('beforeunload', function(e) {
    const answerTextarea = document.getElementById('answer');
    if (answerTextarea && answerTextarea.value !== '') {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus && saveStatus.classList.contains('saving')) {
            e.preventDefault();
            e.returnValue = 'ÝX-gYÚü¸’âŒ~YK';
        }
    }
});

// Enter­ügn¤á’2P
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});

// Chart.js’(W_°éÕÏ;¡;b(	
function drawProgressChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.values(data.categories).map(cat => cat.name),
            datasets: [{
                data: Object.values(data.stats).map(stat => stat.answered),
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c',
                    '#9b59b6',
                    '#1abc9c'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// æüÆ£êÆ£¢p
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function countCharacters(text) {
    return text.length;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}