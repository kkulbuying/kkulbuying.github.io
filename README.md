# 투데이꿀바잉 (Today Kkulbuying)
오늘 마감·놓치면 아까운 핫딜, 카페 할인, 페이 캐시백, 무료체험을 정리하는 정적 웹사이트입니다.
빌드 도구 없이 HTML/CSS/JS만으로 동작하며, GitHub Pages에 그대로 올리면 됩니다.

## 구성

```
index.html            메인 (마감 임박 · 카테고리 · 검색 · 정렬 · 딜 카드 · 상세 모달)
about.html            사이트 소개 / 편집 원칙
contact.html          문의·제보
privacy.html          개인정보처리방침
terms.html            이용약관
404.html              없는 페이지 안내
assets/css/style.css  디자인 (코랄·허니 옐로 + 화이트)
assets/js/deals-data.js  딜 데이터 (자동 생성)
assets/js/app.js      필터·검색·정렬·D-day·상세 모달
assets/img/og-cover.png   공유 미리보기 이미지 (1200x630)
assets/img/icon-180.png   앱 아이콘
sitemap.xml, robots.txt
```

## 딜 데이터 갱신

딜은 `scripts/build_today_kkulbuying.py` 의 `DEALS` 목록 한 곳에서 관리합니다.

```bash
python3 scripts/build_today_kkulbuying.py
```

를 실행하면 `deals-data.js`와 모든 HTML이 다시 생성됩니다.
딜을 추가할 때는 `start`, `end`, `period`, `benefit`, `conditions`(3~4줄), `link`, `source`를 반드시 채웁니다.
`BASIS`(확인 기준일)를 실제 확인한 날짜로 바꾸면 D-day와 안내 문구가 그에 맞게 계산됩니다.

## 배포 (GitHub Pages)

1. GitHub `@minjikangg8-design`에 새 저장소(예: `today-kkulbuying`)를 만듭니다.
2. 이 폴더의 내용을 그대로 올립니다(루트에 index.html).
3. Settings → Pages → Source: `Deploy from a branch`, branch `main` / `/ (root)` 선택.
4. `https://minjikangg8-design.github.io/today-kkulbuying/` 로 열립니다.

저장소 이름을 다르게 쓰면 `scripts/build_today_kkulbuying.py` 의 `SITE_BASE`를 바꾸고 다시 빌드하세요
(canonical, og:url, sitemap, robots 주소가 함께 바뀝니다).

## 원칙

- 확인되지 않은 혜택은 올리지 않습니다. 확인하지 못한 항목은 "공개되지 않음"으로 적습니다.
- 종료된 행사는 목록에서 빼고 "지난 행사"로 내립니다.
- 링크는 판매처 공식 안내로 연결하며, 제휴·광고가 생기면 해당 카드에 표시합니다.
