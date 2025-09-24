// URL 파라미터 읽기
function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function loadManifest() {
  const res = await fetch('data/videos.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('manifest load failed');
  return res.json();
}

function setVideoSources(videoEl, item) {
  // 기존 소스/트랙 초기화
  videoEl.innerHTML = '';

  const source = document.createElement('source');
  source.src = item.src;     // 예: "videos/alpha.mp4"
  source.type = 'video/mp4'; // 필요 시 webm 추가 가능
  videoEl.appendChild(source);

  if (item.caption) {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Korean';
    track.srclang = 'ko';
    track.src = item.caption; // 예: "captions/alpha.vtt"
    track.default = true;
    videoEl.appendChild(track);
  }

  if (item.poster) {
    videoEl.setAttribute('poster', item.poster);
  } else {
    videoEl.removeAttribute('poster');
  }
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.hidden = false;
}

(async function init() {
  const v = getParam('v'); // slug
  const titleEl = document.getElementById('title');
  const videoEl = document.getElementById('video');
  const overlayBtn = document.getElementById('overlayPlay');
  const openDirect = document.getElementById('openDirect');

  try {
    const manifest = await loadManifest();
    const item = manifest.find(x => x.slug === v);

    if (!item) {
      titleEl.textContent = '잘못된 링크입니다';
      showError('존재하지 않는 영상입니다. QR 코드를 다시 확인해주세요.');
      overlayBtn.classList.add('hidden');
      return;
    }

    // 제목/소스 설정
    document.title = item.title || '동영상 재생';
    titleEl.textContent = item.title || '동영상';
    setVideoSources(videoEl, item);

    // 사용자 친화: 초기엔 overlay 보이고, 탭시키면 play()
    const startPlayback = async () => {
      overlayBtn.classList.add('hidden');
      try {
        // iOS에서 인라인 재생 유도
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('webkit-playsinline', '');
        await videoEl.play();
      } catch (err) {
        // 자동 재생이 막히면 컨트롤만 보여주고 실패 메시지는 생략
        console.warn('play failed:', err);
      }
    };

    overlayBtn.addEventListener('click', startPlayback, { once: true });

    // 사용자가 굳이 오버레이 말고 컨트롤로도 바로 재생 가능
    videoEl.addEventListener('play', () => {
      overlayBtn.classList.add('hidden');
    });

    // “새 탭에서 열기” 링크
    openDirect.href = item.src;

    // 쿼리로 시작 지점 지정 (?t=12.5)
    const t = parseFloat(getParam('t') || '');
    if (!isNaN(t) && t >= 0) {
      videoEl.currentTime = t;
    }
  } catch (e) {
    console.error(e);
    titleEl.textContent = '로딩 오류';
    showError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    document.getElementById('overlayPlay').classList.add('hidden');
  }
})();
