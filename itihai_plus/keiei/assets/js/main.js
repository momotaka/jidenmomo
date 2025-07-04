// 廃棄物処理業 経営戦略支援システム - メインJavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Bootstrap tooltips初期化
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // アラート自動クローズ
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // 確認ダイアログ
    const confirmButtons = document.querySelectorAll('[data-confirm]');
    confirmButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // 数値入力フィールドのフォーマット
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(function(input) {
        input.addEventListener('blur', function() {
            if (this.value && !isNaN(this.value)) {
                const decimals = this.getAttribute('data-decimals') || 0;
                this.value = parseFloat(this.value).toFixed(decimals);
            }
        });
    });

    // 日付入力の今日ボタン
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(function(input) {
        if (input.getAttribute('data-today-button') === 'true') {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-sm btn-outline-secondary ms-2';
            button.textContent = '今日';
            button.addEventListener('click', function() {
                const today = new Date().toISOString().split('T')[0];
                input.value = today;
            });
            input.parentNode.appendChild(button);
        }
    });

    // サイドバーのアクティブリンク設定
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(function(link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // フォームの送信前検証
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // 部門別色設定
    const departmentBadges = document.querySelectorAll('[data-department]');
    departmentBadges.forEach(function(badge) {
        const dept = badge.getAttribute('data-department');
        badge.classList.add('badge-' + dept);
    });

    // テーブルのソート機能
    const sortableTables = document.querySelectorAll('.sortable');
    sortableTables.forEach(function(table) {
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(function(header) {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                sortTable(table, this);
            });
        });
    });

    // 印刷ボタン
    const printButtons = document.querySelectorAll('[data-print]');
    printButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            window.print();
        });
    });

    // Ajax読み込みインジケーター
    let ajaxCount = 0;
    const spinner = createSpinner();

    function createSpinner() {
        const div = document.createElement('div');
        div.className = 'spinner-overlay d-none';
        div.innerHTML = '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(div);
        return div;
    }

    function showSpinner() {
        ajaxCount++;
        spinner.classList.remove('d-none');
    }

    function hideSpinner() {
        ajaxCount--;
        if (ajaxCount <= 0) {
            ajaxCount = 0;
            spinner.classList.add('d-none');
        }
    }

    // Fetchラッパー
    window.fetchWithSpinner = function(url, options = {}) {
        showSpinner();
        return fetch(url, options)
            .finally(() => hideSpinner());
    };

    // チャート共通設定
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#495057';
    }
});

// テーブルソート関数
function sortTable(table, header) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentNode.children).indexOf(header);
    const sortType = header.getAttribute('data-sort');
    const currentOrder = header.getAttribute('data-order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

    rows.sort(function(a, b) {
        let aValue = a.children[columnIndex].textContent.trim();
        let bValue = b.children[columnIndex].textContent.trim();

        if (sortType === 'number') {
            aValue = parseFloat(aValue.replace(/[^0-9.-]/g, '')) || 0;
            bValue = parseFloat(bValue.replace(/[^0-9.-]/g, '')) || 0;
        } else if (sortType === 'date') {
            aValue = new Date(aValue).getTime() || 0;
            bValue = new Date(bValue).getTime() || 0;
        }

        if (newOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // ソートアイコン更新
    table.querySelectorAll('th[data-sort]').forEach(function(th) {
        th.removeAttribute('data-order');
        th.querySelectorAll('.sort-icon').forEach(icon => icon.remove());
    });

    header.setAttribute('data-order', newOrder);
    const icon = document.createElement('i');
    icon.className = 'bi bi-arrow-' + (newOrder === 'asc' ? 'up' : 'down') + ' sort-icon ms-1';
    header.appendChild(icon);

    // 行を再配置
    rows.forEach(function(row) {
        tbody.appendChild(row);
    });
}

// 数値フォーマット関数
function formatCurrency(amount) {
    return '¥' + amount.toLocaleString('ja-JP');
}

function formatNumber(number, decimals = 0) {
    return number.toLocaleString('ja-JP', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// 日付フォーマット関数
function formatDate(date, format = 'Y年m月d日') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return format
        .replace('Y', year)
        .replace('m', month)
        .replace('d', day);
}