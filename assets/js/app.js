/* =========================================================
   투데이꿀바잉 — 화면 동작 (필터 · 검색 · 정렬 · 상세 보기)
   의존성 없음. 딜 데이터는 assets/js/deals-data.js 의 window.KKUL_DEALS
   ========================================================= */
(function () {
  "use strict";

  var DATA = window.KKUL_DEALS || {};
  var META = window.KKUL_META || { basis: "2026-11-25" };

  var grid = document.getElementById("deal-grid");
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".deal")) : [];
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var searchInput = document.getElementById("deal-search");
  var sortSelect = document.getElementById("deal-sort");
  var resultLine = document.getElementById("result-line");
  var emptyState = document.getElementById("empty-state");
  var highlightRow = document.getElementById("highlight-row");
  var highlightSection = document.getElementById("highlight");
  var expiredBox = document.getElementById("expired-box");
  var expiredList = document.getElementById("expired-list");
  var expiredCountEl = document.getElementById("expired-count");
  var basisWarning = document.getElementById("basis-warning");
  var todayLabel = document.getElementById("today-label");
  var statToday = document.getElementById("stat-today");
  var statWeek = document.getElementById("stat-week");
  var statTotal = document.getElementById("stat-total");

  var state = { cat: "all", q: "", sort: "deadline" };

  /* ---------- 날짜 도우미 ---------- */
  function parseDate(str) {
    if (!str) return null;
    var p = String(str).split("-");
    if (p.length !== 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function dayDiff(a, b) {
    return Math.round((a.getTime() - b.getTime()) / 86400000);
  }

  function fmtDate(d) {
    if (!d) return "";
    return d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate();
  }

  function fmtKr(d) {
    var weeks = ["일", "월", "화", "수", "목", "금", "토"];
    return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일(" + weeks[d.getDay()] + ")";
  }

  function endOf(card) {
    return parseDate(card.getAttribute("data-end"));
  }

  function isAlways(card) {
    return card.getAttribute("data-always") === "true";
  }

  function isExpired(card) {
    if (isAlways(card)) return false;
    var end = endOf(card);
    if (!end) return false;
    return dayDiff(end, today) < 0;
  }

  /* ---------- D-day 표시 ---------- */
  function paintDday(card) {
    var badge = card.querySelector("[data-dday]");
    if (!badge) return;
    if (isAlways(card)) {
      badge.textContent = "상시";
      badge.className = "dday is-always";
      return;
    }
    var end = endOf(card);
    if (!end) return;
    var d = dayDiff(end, today);
    badge.className = "dday";
    if (d === 0) {
      badge.textContent = "오늘 마감";
      badge.className = "dday is-today";
    } else if (d > 0) {
      badge.textContent = "D-" + d;
      if (d <= 3) badge.className = "dday is-soon";
    } else {
      badge.textContent = "종료";
    }
  }

  /* ---------- 정렬용 값 ---------- */
  function sortValue(card, mode) {
    if (mode === "latest") {
      var s = parseDate(card.getAttribute("data-start"));
      return s ? s.getTime() : 0;
    }
    if (isAlways(card)) return Number.MAX_SAFE_INTEGER;
    var e = endOf(card);
    return e ? e.getTime() : Number.MAX_SAFE_INTEGER;
  }

  /* ---------- 필터 · 정렬 적용 ---------- */
  function apply() {
    var q = state.q.trim().toLowerCase();
    var visible = 0;
    var live = 0;

    cards.forEach(function (card) {
      var expired = isExpired(card);
      if (!expired) live++;
      var catOk = state.cat === "all" || card.getAttribute("data-cat") === state.cat;
      var qOk = !q || (card.getAttribute("data-search") || "").toLowerCase().indexOf(q) !== -1;
      var show = !expired && catOk && qOk;
      card.classList.toggle("is-hidden", !show);
      if (show) visible++;
    });

    // DOM 순서 정렬 (마감 임박순: 오름차순 / 최신순: 시작일 내림차순)
    var dir = state.sort === "latest" ? -1 : 1;
    var sorted = cards.slice().sort(function (a, b) {
      return (sortValue(a, state.sort) - sortValue(b, state.sort)) * dir;
    });
    sorted.forEach(function (card) {
      grid.appendChild(card);
    });

    if (resultLine) {
      if (visible === 0) {
        resultLine.innerHTML = "조건에 맞는 행사가 없습니다. 검색어나 카테고리를 바꿔 보세요.";
      } else {
        resultLine.innerHTML =
          "<strong>" + visible + "건</strong> 표시 · 진행 중인 행사 " + live + "건 중";
      }
    }
    if (emptyState) emptyState.style.display = visible === 0 ? "block" : "none";

    // 탭 개수 갱신
    tabs.forEach(function (tab) {
      var key = tab.getAttribute("data-cat");
      var countEl = tab.querySelector(".tab-count");
      if (!countEl) return;
      var n = key === "all"
        ? live
        : cards.filter(function (c) {
            return c.getAttribute("data-cat") === key && !isExpired(c);
          }).length;
      countEl.textContent = n;
    });
  }

  /* ---------- 지난 행사 정리 ---------- */
  function collectExpired() {
    if (!expiredBox || !expiredList) return;
    var expired = cards.filter(isExpired);
    if (statTotal) statTotal.textContent = cards.length - expired.length;

    if (!expired.length) {
      expiredBox.hidden = true;
      return;
    }

    expired.forEach(function (card) {
      var item = document.createElement("div");
      item.className = "expired-item";
      var h = document.createElement("h3");
      h.textContent = card.getAttribute("data-title") || "";
      var period = document.createElement("span");
      period.textContent = "종료 " + (card.getAttribute("data-period") || "");
      item.appendChild(h);
      item.appendChild(period);
      expiredList.appendChild(item);
    });
    if (expiredCountEl) expiredCountEl.textContent = expired.length;
  }

  /* ---------- 마감 임박 하이라이트 ---------- */
  function cleanHighlight() {
    if (!highlightRow) return;
    var hcards = Array.prototype.slice.call(highlightRow.querySelectorAll(".hcard"));
    var kept = 0;
    hcards.forEach(function (card) {
      if (isExpired(card)) {
        card.parentNode.removeChild(card);
      } else {
        kept++;
        var badge = card.querySelector("[data-dday]");
        if (badge && !isAlways(card)) {
          var d = dayDiff(endOf(card), today);
          badge.textContent = d === 0 ? "오늘 마감" : "D-" + d;
          badge.className = d === 0 ? "dday is-today" : "dday is-soon";
        }
      }
    });
    if (!kept && highlightSection) highlightSection.hidden = true;
  }

  /* ---------- 통계 ---------- */
  function paintStats() {
    var live = cards.filter(function (c) { return !isExpired(c); });
    var dueToday = live.filter(function (c) {
      return !isAlways(c) && dayDiff(endOf(c), today) === 0;
    }).length;
    var dueWeek = live.filter(function (c) {
      if (isAlways(c)) return false;
      var d = dayDiff(endOf(c), today);
      return d >= 0 && d <= 6;
    }).length;
    if (statToday) statToday.textContent = dueToday + "건";
    if (statWeek) statWeek.textContent = dueWeek + "건";
  }

  /* ---------- 기준일 안내 ---------- */
  function paintBasis() {
    if (todayLabel) todayLabel.textContent = fmtKr(today);
    var basis = parseDate(META.basis);
    if (basisWarning && basis && dayDiff(today, basis) > 0) {
      basisWarning.hidden = false;
      basisWarning.textContent =
        "이 목록은 " + fmtDate(basis) + " 기준으로 직접 확인한 행사입니다. 오늘은 " +
        fmtKr(today) + "이며, 이미 끝난 행사는 목록에서 빠지고 아래 ‘지난 행사’에 모입니다.";
    }
  }

  /* ---------- 모달 ---------- */
  var modal = document.getElementById("deal-modal");
  var modalBody = document.getElementById("modal-body");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function renderModal(deal) {
    if (!modalBody) return;
    modalBody.textContent = "";

    var head = el("div", "modal-head");
    var chip = el("span", "chip " + (deal.chipClass || ""), deal.catLabel || "");
    head.appendChild(chip);
    var h2 = el("h2", null, deal.title);
    h2.id = "modal-title";
    head.appendChild(h2);
    head.appendChild(el("p", "modal-lead", deal.lead || ""));
    modalBody.appendChild(head);

    var facts = el("div", "modal-block");
    facts.appendChild(el("h3", null, "한눈에 보기"));
    var dl = el("dl", "modal-facts");
    [["혜택", deal.benefit], ["기간", deal.period], ["대상", deal.where]].forEach(function (row) {
      if (!row[1]) return;
      var wrap = el("div");
      wrap.appendChild(el("dt", null, row[0]));
      wrap.appendChild(el("dd", null, row[1]));
      dl.appendChild(wrap);
    });
    facts.appendChild(dl);
    modalBody.appendChild(facts);

    if (deal.summary) {
      var sum = el("div", "modal-block");
      sum.appendChild(el("h3", null, "어떤 혜택인가요"));
      sum.appendChild(el("p", "modal-lead", deal.summary));
      modalBody.appendChild(sum);
    }

    if (deal.conditions && deal.conditions.length) {
      var cond = el("div", "modal-block");
      cond.appendChild(el("h3", null, "꼭 확인할 조건·제외 사항"));
      var ul = el("ul", "modal-list");
      deal.conditions.forEach(function (line) {
        ul.appendChild(el("li", null, line));
      });
      cond.appendChild(ul);
      modalBody.appendChild(cond);
    }

    var foot = el("div", "modal-foot");
    if (deal.link && deal.link.url) {
      var a = el("a", "btn btn-solid", deal.link.label || "공식 안내 바로가기 ↗");
      a.href = deal.link.url;
      a.target = "_blank";
      a.rel = "noopener nofollow";
      foot.appendChild(a);
    }
    var closeBtn = el("button", "btn btn-ghost", "닫기");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", closeModal);
    foot.appendChild(closeBtn);
    modalBody.appendChild(foot);

    var src = el("p", "modal-source");
    src.appendChild(document.createTextNode("출처: "));
    if (deal.source && deal.source.url) {
      var s = el("a", null, deal.source.label || deal.source.url);
      s.href = deal.source.url;
      s.target = "_blank";
      s.rel = "noopener nofollow";
      src.appendChild(s);
    } else {
      src.appendChild(document.createTextNode((deal.source && deal.source.label) || "운영자 확인"));
    }
    src.appendChild(
      document.createTextNode(" · 확인일 " + (deal.verified || META.basis) + " · 조건은 판매처 사정으로 바뀔 수 있습니다.")
    );
    modalBody.appendChild(src);
  }

  function openModal(id, updateHash) {
    var deal = DATA[id];
    if (!deal || !modal) return;
    renderModal(deal);
    if (typeof modal.showModal === "function") {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    if (modalBody) modalBody.scrollTop = 0;
    if (updateHash !== false && history.replaceState) {
      history.replaceState(null, "", "#deal-" + id);
    }
  }

  function closeModal() {
    if (!modal) return;
    if (typeof modal.close === "function" && modal.open) modal.close();
    else modal.removeAttribute("open");
    if (history.replaceState) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute("data-open"));
      return;
    }
    if (e.target === modal) closeModal();
  });

  if (modal) {
    modal.addEventListener("cancel", function (e) {
      e.preventDefault();
      closeModal();
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    var mClose = modal.querySelector(".modal-close");
    if (mClose) mClose.addEventListener("click", closeModal);
  }

  /* ---------- 탭 · 검색 · 정렬 ---------- */
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      state.cat = tab.getAttribute("data-cat");
      tabs.forEach(function (t) {
        t.setAttribute("aria-pressed", t === tab ? "true" : "false");
      });
      apply();
    });
  });

  if (searchInput) {
    var t = null;
    searchInput.addEventListener("input", function () {
      window.clearTimeout(t);
      t = window.setTimeout(function () {
        state.q = searchInput.value;
        apply();
      }, 120);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      state.sort = sortSelect.value;
      apply();
    });
  }

  /* ---------- 시작 ---------- */
  cards.forEach(paintDday);
  cleanHighlight();
  collectExpired();
  paintStats();
  paintBasis();
  apply();

  if (window.location.hash.indexOf("#deal-") === 0) {
    openModal(window.location.hash.replace("#deal-", ""), false);
  }
})();
