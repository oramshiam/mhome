const WatchForm = document.getElementById("watchList-form");
const WatchInput = WatchForm.querySelector("input");
const WatchList = document.getElementById("watchList-list");
const Index = document.getElementById("index");


let Watchs = []; // localStorage 제거됨

// ✅ Google Spreadsheet JSON API
const JSON_URL = "https://script.google.com/macros/s/AKfycbwyLoWGsG-0gH1TVuhgmqQVd-vIvVccDZzhATr4YRNZrMWfM6qozVhyb_QkJle_m6drlQ/exec?sheet=US_sector";

// ✅ Spreadsheet에서 종목 불러오기 (수정본)
function loadFromSheet() {
  console.log("시트 데이터 로드 시작...");
  fetch(JSON_URL)
    .then(res => res.json())
    .then(data => {
      // 1. 데이터가 배열인지 확인 (객체로 감싸져 올 경우 대비)
      const entries = Array.isArray(data) ? data : (data.data || []);
      
      if (entries.length === 0) {
        console.warn("불러올 데이터가 없습니다.");
        return;
      }

      entries.forEach((entry, index) => {
        // 2. [핵심 수정] 키 이름 대신 객체의 첫 번째 값을 심볼로 추출
        const values = Object.values(entry);
        const symbol = values[0] ? values[0].toString().trim() : "";
        
        if (!symbol) return;

        const upperSymbol = symbol.toUpperCase();
        if (Watchs.some(w => w.text === upperSymbol)) return;

        const newWatchObj = {
          text: upperSymbol,
          id: `tv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
          base: "",
          fundamentals: "",
          comments: "",
          lossCut: ""
        };
        
        Watchs.push(newWatchObj);
        paintWatch(newWatchObj);
      });

      // 3. [핵심 수정] 모든 li가 생성된 후 Intersection Observer 초기화
      // setTimeout을 사용하여 DOM이 완전히 그려진 후 실행되도록 보장합니다.
      setTimeout(() => {
        initIntersectionObserver();
      }, 500);
    })
    .catch(err => console.error("데이터 로딩 실패:", err));
}

// ✅ Observer 로직을 별도 함수로 분리하여 관리
function initIntersectionObserver() {
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const li = entry.target;
        const iframes = li.querySelectorAll("iframe[data-src]");
        
        iframes.forEach(iframe => {
          if (iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
            delete iframe.dataset.src;
          }
        });
        observer.unobserve(li);
      }
    });
  }, { rootMargin: '0px 0px 300px 0px' });

  const listItems = WatchList.querySelectorAll('li');
  listItems.forEach(item => observer.observe(item));
  console.log(`${listItems.length}개의 항목에 대해 감시를 시작합니다.`);
}

function paintWatch(newWatchObj) {
  const li = document.createElement("li");
  li.id = newWatchObj.id;
  li.style.display = "flex";
  li.style.alignItems = "flex-start";
  li.style.gap = "10px";
  li.style.marginBottom = "20px"; // 간격을 조금 더 넓혔습니다.
  li.style.minHeight = "300px";  // Observer 감지를 위해 최소 높이 설정

  // Weekly 차트
  const iframeW = document.createElement("iframe");
  iframeW.dataset.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${newWatchObj.id}_W&symbol=${newWatchObj.text}&interval=W&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=true&hide_side_toolbar=true&hide_top_toolbar=false&allow_symbol_change=true&details=false&calendar=false&studies=STD;MA%25251Cross&autosize=true&compareSymbols=[{"symbol":%20"NASDAQ:QQQ","position":%20"SameScale"}]`;
  iframeW.style.width = "50%";
  iframeW.style.height = "300px";
  iframeW.style.border = "none";
  iframeW.allowFullscreen = true;

  // Daily 차트
  const iframeD = document.createElement("iframe");
  iframeD.dataset.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${newWatchObj.id}_D&symbol=${newWatchObj.text}&interval=D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=true&hide_side_toolbar=true&hide_top_toolbar=false&allow_symbol_change=true&details=false&calendar=false&studies=STD;EMA&autosize=true`;
  iframeD.style.width = "50%";
  iframeD.style.height = "300px";
  iframeD.style.border = "none";
  iframeD.allowFullscreen = true;

  li.style.cursor = "grab";
  li.draggable = true;
  li.addEventListener("dragstart", handleDragStart);
  li.addEventListener("dragover", handleDragOver);
  li.addEventListener("drop", handleDrop);

  li.appendChild(iframeD);
  li.appendChild(iframeW);
  WatchList.appendChild(li);
}

function handleWatchSubmit(event) {
  event.preventDefault();
  const newWatch = WatchInput.value.trim().toUpperCase();
  if (!newWatch || Watchs.some(w => w.text === newWatch)) return;

  WatchInput.value = "";
  const newWatchObj = {
    text: newWatch,
    id: Date.now(),
    base: "",
    fundamentals: "",
    comments: "",
    lossCut: ""
  };

  Watchs.push(newWatchObj);
  paintWatch(newWatchObj);
}

// 🎯 삭제된 기능: localStorage, 저장/불러오기 없음

WatchForm.addEventListener("submit", handleWatchSubmit);

// 🎯 페이지 로드 시 스프레드시트에서만 불러옴
//loadIndexCharts();
loadFromSheet();

// ========== Drag-and-Drop ==========

let draggedItemId = null;

function handleDragStart(event) {
  const li = event.currentTarget.closest("li");
  if (!li) return;
  draggedItemId = li.id;
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
  event.preventDefault();
  const targetLi = event.currentTarget.closest("li");
  if (!targetLi || draggedItemId === targetLi.id) return;

  const draggedEl = document.getElementById(draggedItemId);
  const bounding = targetLi.getBoundingClientRect();
  const offset = event.clientY - bounding.top;

  if (offset > bounding.height / 2) {
    targetLi.after(draggedEl);
  } else {
    targetLi.before(draggedEl);
  }
}

/**
 * 스크롤 이벤트 발생 시 호출되는 함수
 */

const SCROLL_KEY = 'lastScrollY';

function handleScroll() {
    // window.scrollY는 현재 문서의 수직 스크롤 오프셋을 픽셀 단위로 반환합니다.
    const currentScrollY = window.scrollY;
    
    // 이전에 저장된 스크롤 위치를 가져옵니다. (숫자로 변환)
    const storedScrollY = parseInt(localStorage.getItem(SCROLL_KEY), 10);

    if (currentScrollY === 0) {
        if (storedScrollY && storedScrollY > 0) {
            
            // 저장된 스크롤 위치로 이동
            window.scrollTo({
                top: storedScrollY,
                behavior: 'instant' // 부드러운 스크롤 없이 즉시 이동
            });
            
            // 이동 후 다시 저장하여 0으로 저장되는 것을 방지
            localStorage.setItem(SCROLL_KEY, storedScrollY.toString());
        } else {
            // 저장된 위치가 없거나 0이면, 0으로 저장하여 초기 상태 유지
            localStorage.setItem(SCROLL_KEY, '0');
        }

    } else {
        // 현재 위치가 0이 아니면, 이 위치를 localstorage에 저장합니다.
        localStorage.setItem(SCROLL_KEY, currentScrollY.toString());
    }
}

window.addEventListener('scroll', handleScroll);
