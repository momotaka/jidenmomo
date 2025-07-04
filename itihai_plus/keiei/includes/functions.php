<?php
// 共通関数

function h($str) {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

function redirect($url) {
    header("Location: $url");
    exit;
}

function formatCurrency($amount) {
    return '¥' . number_format($amount);
}

function formatNumber($number, $decimals = 0) {
    return number_format($number, $decimals);
}

function formatDate($date, $format = 'Y年m月d日') {
    if (empty($date)) return '';
    $dateTime = new DateTime($date);
    return $dateTime->format($format);
}

function calculateGrossMargin($sales, $cost) {
    if ($sales == 0) return 0;
    return (($sales - $cost) / $sales) * 100;
}

function getMonthRange($month = null) {
    if ($month === null) {
        $month = date('Y-m');
    }
    
    $start = date('Y-m-01', strtotime($month));
    $end = date('Y-m-t', strtotime($month));
    
    return ['start' => $start, 'end' => $end];
}

function getQuarterRange($year = null, $quarter = null) {
    if ($year === null) {
        $year = date('Y');
    }
    if ($quarter === null) {
        $quarter = ceil(date('n') / 3);
    }
    
    $startMonth = ($quarter - 1) * 3 + 1;
    $endMonth = $quarter * 3;
    
    $start = sprintf('%d-%02d-01', $year, $startMonth);
    $end = sprintf('%d-%02d-%02d', $year, $endMonth, cal_days_in_month(CAL_GREGORIAN, $endMonth, $year));
    
    return ['start' => $start, 'end' => $end];
}

function validateRequired($value, $fieldName) {
    if (empty($value)) {
        return "{$fieldName}は必須項目です。";
    }
    return null;
}

function validateNumeric($value, $fieldName) {
    if (!is_numeric($value)) {
        return "{$fieldName}は数値で入力してください。";
    }
    return null;
}

function validateDate($value, $fieldName) {
    $date = DateTime::createFromFormat('Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value) {
        return "{$fieldName}は正しい日付形式で入力してください。";
    }
    return null;
}

function validateEmail($value, $fieldName) {
    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
        return "{$fieldName}は正しいメールアドレス形式で入力してください。";
    }
    return null;
}

function getDepartmentName($key) {
    return DEPARTMENTS[$key] ?? $key;
}

function getContractTypeName($key) {
    return CONTRACT_TYPES[$key] ?? $key;
}

function getCustomerTypeName($key) {
    return CUSTOMER_TYPES[$key] ?? $key;
}

function getPriorityName($key) {
    return PRIORITY_LEVELS[$key] ?? $key;
}

function getFeedbackStatusName($key) {
    return FEEDBACK_STATUS[$key] ?? $key;
}

function getCrossSellStatusName($key) {
    return CROSS_SELL_STATUS[$key] ?? $key;
}

function generateSelectOptions($options, $selected = null) {
    $html = '';
    foreach ($options as $value => $label) {
        $isSelected = ($value == $selected) ? 'selected' : '';
        $html .= sprintf('<option value="%s" %s>%s</option>', h($value), $isSelected, h($label));
    }
    return $html;
}

function showAlert($message, $type = 'info') {
    $typeClasses = [
        'success' => 'alert-success',
        'error' => 'alert-danger',
        'warning' => 'alert-warning',
        'info' => 'alert-info'
    ];
    
    $class = $typeClasses[$type] ?? 'alert-info';
    
    return sprintf(
        '<div class="alert %s alert-dismissible fade show" role="alert">
            %s
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>',
        $class,
        h($message)
    );
}

function getFlashMessage() {
    if (isset($_SESSION['flash_message'])) {
        $message = $_SESSION['flash_message'];
        $type = $_SESSION['flash_type'] ?? 'info';
        unset($_SESSION['flash_message'], $_SESSION['flash_type']);
        return showAlert($message, $type);
    }
    return '';
}

function setFlashMessage($message, $type = 'info') {
    $_SESSION['flash_message'] = $message;
    $_SESSION['flash_type'] = $type;
}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return trim(strip_tags($input));
}

function getPaginationInfo($totalItems, $itemsPerPage, $currentPage) {
    $totalPages = ceil($totalItems / $itemsPerPage);
    $offset = ($currentPage - 1) * $itemsPerPage;
    
    return [
        'total_items' => $totalItems,
        'items_per_page' => $itemsPerPage,
        'current_page' => $currentPage,
        'total_pages' => $totalPages,
        'offset' => $offset,
        'has_prev' => $currentPage > 1,
        'has_next' => $currentPage < $totalPages
    ];
}

function renderPagination($paginationInfo, $baseUrl) {
    if ($paginationInfo['total_pages'] <= 1) {
        return '';
    }
    
    $html = '<nav><ul class="pagination">';
    
    // 前へボタン
    if ($paginationInfo['has_prev']) {
        $prevPage = $paginationInfo['current_page'] - 1;
        $html .= sprintf('<li class="page-item"><a class="page-link" href="%s?page=%d">前へ</a></li>', $baseUrl, $prevPage);
    } else {
        $html .= '<li class="page-item disabled"><span class="page-link">前へ</span></li>';
    }
    
    // ページ番号
    for ($i = 1; $i <= $paginationInfo['total_pages']; $i++) {
        $active = ($i == $paginationInfo['current_page']) ? 'active' : '';
        $html .= sprintf('<li class="page-item %s"><a class="page-link" href="%s?page=%d">%d</a></li>', $active, $baseUrl, $i, $i);
    }
    
    // 次へボタン
    if ($paginationInfo['has_next']) {
        $nextPage = $paginationInfo['current_page'] + 1;
        $html .= sprintf('<li class="page-item"><a class="page-link" href="%s?page=%d">次へ</a></li>', $baseUrl, $nextPage);
    } else {
        $html .= '<li class="page-item disabled"><span class="page-link">次へ</span></li>';
    }
    
    $html .= '</ul></nav>';
    
    return $html;
}