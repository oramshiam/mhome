const WatchForm = document.getElementById("watchList-form");
const WatchInput = WatchForm.querySelector("input");
const WatchList = document.getElementById("watchList-list");

let Watchs = []; // localStorage 제거됨

// ✅ Google Spreadsheet JSON API
const JSON_URL = "https://script.google.com/macros/s/AKfycbwyLoWGsG-0gH1TVuhgmqQVd-vIvVccDZzhATr4YRNZrMWfM6qozVhyb_QkJle_m6drlQ/exec?sheet=US";

// ✅ Spreadsheet에서 종목 불러오기
function loadFromSheet() {
  fetch(JSON_URL)
    .then(res => res.json())
    .then(data => {
      data.forEach(entry => {
        const symbol = entry.Symbol?.trim();
        if (!symbol) return;

        const upperSymbol = symbol.toUpperCase();
        if (Watchs.some(w => w.text === upperSymbol)) return;

        const newWatchObj = {
          text: upperSymbol,
          id: Date.now() + Math.random(),
          base: "",
          fundamentals: "",
          comments: "",
          lossCut: ""
        };
        Watchs.push(newWatchObj);
        paintWatch(newWatchObj);
      });
    });
}


function paintWatch(newWatchObj) {
  const li = document.createElement("li");
  li.id = newWatchObj.id;
  li.style.display = "flex";
  li.style.alignItems = "flex-start";
  li.style.gap = "10px";
  li.style.marginBottom = "10px";

  const iframeW = document.createElement("iframe");
  iframeW.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${newWatchObj.id}_W&symbol=${newWatchObj.text}&interval=W&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=true&hide_side_toolbar=true&hide_top_toolbar=false&allow_symbol_change=true&details=false&calendar=false&studies=[]&autosize=true&compareSymbols=[{"symbol":%20"NASDAQ:QQQ","position":%20"SameScale"}]`;
  iframeW.style.width = "50%";
  iframeW.style.height = "300px";
  iframeW.style.border = "none";
  iframeW.allowFullscreen = true;

  const iframeD = document.createElement("iframe");
  iframeD.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${newWatchObj.id}_D&symbol=${newWatchObj.text}&interval=D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=true&hide_side_toolbar=true&hide_top_toolbar=false&allow_symbol_change=true&details=false&calendar=false&studies=[]&autosize=true`;
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
