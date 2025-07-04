// 経営者自伝作成システム - JavaScriptファイル

document.addEventListener('DOMContentLoaded', function() {
    // 自動保存機能の初期化
    initAutoSave();
    
    // フォーム送信の防止
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });
});

// 自動保存機能
function initAutoSave() {
    const answerTextarea = document.getElementById('answer');
    const saveStatus = document.getElementById('saveStatus');
    const questionId = document.getElementById('questionId');
    
    if (!answerTextarea || !questionId) return;
    
    let saveTimeout;
    let lastSavedContent = answerTextarea.value;
    let isSaving = false;
    
    // ローカルストレージにも一時保存
    const localStorageKey = `answer_${questionId.value}`;
    
    // ページ読み込み時にローカルストレージから復元
    const savedLocal = localStorage.getItem(localStorageKey);
    if (savedLocal && savedLocal !== answerTextarea.value) {
        if (confirm('前回の未保存データがあります。復元しますか？')) {
            answerTextarea.value = savedLocal;
        }
    }
    
    // テキストエリアの変更を監視
    answerTextarea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        
        // 内容が変更されていない場合は保存しない
        if (this.value === lastSavedContent) return;
        
        // ローカルストレージに即座に保存
        localStorage.setItem(localStorageKey, this.value);
        
        // 保存中の表示
        showSaveStatus('saving', '保存中...');
        
        // 2秒後に自動保存（ネットワーク負荷軽減）
        saveTimeout = setTimeout(() => {
            if (!isSaving) {
                saveAnswer(questionId.value, this.value);
            }
        }, 2000);
    });
    
    // 回答を保存する関数
    async function saveAnswer(qId, answer) {
        isSaving = true;
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
                showSaveStatus('saved', '保存しました');
                
                // 保存成功したらローカルストレージをクリア
                localStorage.removeItem(localStorageKey);
                
                // 3秒後に保存メッセージを非表示
                setTimeout(() => {
                    hideSaveStatus();
                }, 3000);
            } else {
                throw new Error(data.error || '保存に失敗しました');
            }
        } catch (error) {
            console.error('Save error:', error);
            showSaveStatus('error', 'エラー: ' + error.message);
        } finally {
            isSaving = false;
        }
    }
    
    // 保存状態を表示する関数
    function showSaveStatus(type, message) {
        if (!saveStatus) return;
        
        saveStatus.className = 'alert alert-' + 
            (type === 'saved' ? 'success' : type === 'error' ? 'danger' : 'info');
        saveStatus.textContent = message;
        saveStatus.classList.remove('d-none');
    }
    
    // 保存状態を非表示にする関数
    function hideSaveStatus() {
        if (!saveStatus) return;
        saveStatus.classList.add('d-none');
    }
}

// ファイルアップロード機能
function uploadFile(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // アップロード処理
    fetch('api.php?action=upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('ファイルがアップロードされました: ' + data.filename);
        } else {
            throw new Error(data.error || 'アップロードに失敗しました');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        alert('エラー: ' + error.message);
    });
}

// データエクスポート機能
function exportData(format) {
    window.location.href = 'api.php?action=export&format=' + format;
}

// 進捗データの取得
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

// ページ遷移時の確認
window.addEventListener('beforeunload', function(e) {
    const answerTextarea = document.getElementById('answer');
    if (answerTextarea && answerTextarea.value !== '') {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus && saveStatus.classList.contains('saving')) {
            e.preventDefault();
            e.returnValue = '保存中です。ページを離れますか？';
        }
    }
});

// Enterキーでの誤送信を防ぐ
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});

// Chart.jsを使用したグラフ描画（管理画面用）
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

// ユーティリティ関数
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