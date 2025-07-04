import re
from typing import Dict, List
from urllib.parse import urlparse


def normalize_person_name(name: str) -> str:
    """人名の表記を正規化"""
    name = re.sub(r'\s+', '', name)
    
    kanji_variants = {
        '齋': '斉', '齊': '斉',
        '邊': '辺', '邉': '辺',
        '髙': '高',
        '濵': '浜', '濱': '浜',
        '澤': '沢', '澁': '渋',
        '瀨': '瀬', '繩': '縄',
        '廣': '広', '櫻': '桜',
        '眞': '真', '萬': '万'
    }
    
    for old, new in kanji_variants.items():
        name = name.replace(old, new)
    
    return name


def is_jc_official_site(url: str) -> bool:
    """JC公式サイト判定（多様なドメイン形式対応）"""
    url_lower = url.lower()
    
    jc_patterns = [
        r'.*jc\.or\.jp',
        r'.*-jc\.(org|com|jp|net)',
        r'^jc-.*\.(org|com|jp)',
        r'.*jci.*\.(org|com|jp)',
        r'.*(jaycee|junior\.chamber)',
        r'.*青年会議所'
    ]
    
    for pattern in jc_patterns:
        if re.search(pattern, url_lower):
            return True
    return False


def extract_domain(url: str) -> str:
    """URLからドメインを抽出"""
    try:
        parsed = urlparse(url)
        return parsed.netloc
    except:
        return ""


def detect_organization_level(region_name: str) -> str:
    """組織レベルを判定"""
    if "日本青年会議所" in region_name:
        return "national"
    elif "地区協議会" in region_name:
        return "district"
    elif "ブロック" in region_name:
        return "block"
    else:
        return "lom"


EXTRACTION_PATTERNS = [
    r'(?P<year>\d{4})年度?\s*(?P<region>[^　\s]+(?:地区協議会|ブロック|JC|青年会議所))\s*(?P<position>会長|理事長|会頭|副会長|副理事長|専務理事|常務理事|運営専務|理事|監事|顧問)\s*(?P<name>[一-龯ぁ-んァ-ヶー\w]{2,8})',
    r'(?P<committee>[^　\s]*委員会)\s*(?P<position>委員長|副委員長|委員)\s*(?P<name>[一-龯ぁ-んァ-ヶー\w]{2,8})',
    r'(?P<position>事務局長|財政局長|総括幹事|会計幹事|庶務幹事|企画幹事|幹事|副幹事)\s*(?P<name>[一-龯ぁ-んァ-ヶー\w]{2,8})',
    r'(?P<name>[一-龯ぁ-んァ-ヶー\w]{2,8})\s*(?P<position>会長|理事長|委員長|事務局長)',
    r'(?P<name>[一-龯ぁ-んァ-ヶー\w]{2,8})\s*[（(]\s*(?P<position>会長|理事長|委員長)\s*[）)]'
]