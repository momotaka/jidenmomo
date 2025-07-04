// L��\���� - JavaScriptա��

document.addEventListener('DOMContentLoaded', function() {
    // ���X_�n
    initAutoSave();
    
    // թ���n2b
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });
});

// ���X_�
function initAutoSave() {
    const answerTextarea = document.getElementById('answer');
    const saveStatus = document.getElementById('saveStatus');
    const questionId = document.getElementById('questionId');
    
    if (!answerTextarea || !questionId) return;
    
    let saveTimeout;
    let lastSavedContent = answerTextarea.value;
    
    // ƭ�Ȩ�n	���
    answerTextarea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        
        // ��L	�U�fDjD4o�XWjD
        if (this.value === lastSavedContent) return;
        
        // �X-nh:
        showSaveStatus('saving', '�X-...');
        
        // 1Ҍk���X
        saveTimeout = setTimeout(() => {
            saveAnswer(questionId.value, this.value);
        }, 1000);
    });
    
    // �T��XY��p
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
                showSaveStatus('saved', '�XW~W_');
                
                // 3Ҍk�X�û���^h:
                setTimeout(() => {
                    hideSaveStatus();
                }, 3000);
            } else {
                throw new Error(data.error || '�Xk1WW~W_');
            }
        } catch (error) {
            console.error('Save error:', error);
            showSaveStatus('error', '���: ' + error.message);
        }
    }
    
    // �X�K�h:Y��p
    function showSaveStatus(type, message) {
        if (!saveStatus) return;
        
        saveStatus.className = 'alert alert-' + 
            (type === 'saved' ? 'success' : type === 'error' ? 'danger' : 'info');
        saveStatus.textContent = message;
        saveStatus.classList.remove('d-none');
    }
    
    // �X�K�^h:kY��p
    function hideSaveStatus() {
        if (!saveStatus) return;
        saveStatus.classList.add('d-none');
    }
}

// ա�������_�
function uploadFile(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // �������
    fetch('api.php?action=upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('ա��L������U�~W_: ' + data.filename);
        } else {
            throw new Error(data.error || '������k1WW~W_');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        alert('���: ' + error.message);
    });
}

// ���������_�
function exportData(format) {
    window.location.href = 'api.php?action=export&format=' + format;
}

// 2W���n֗
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

// ���w�Bn��
window.addEventListener('beforeunload', function(e) {
    const answerTextarea = document.getElementById('answer');
    if (answerTextarea && answerTextarea.value !== '') {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus && saveStatus.classList.contains('saving')) {
            e.preventDefault();
            e.returnValue = '�X-gY�����~YK';
        }
    }
});

// Enter��gn��2P
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});

// Chart.js�(W_����;�;b(	
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

// ��ƣ�ƣ�p
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