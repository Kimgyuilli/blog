import { ANIMATIONS, GLYPHS, renderSvg, type AnimationName, type Overlay } from './sprite';

const GLYPH_COUNT: Record<Overlay, number> = { zzz: 2, alert: 1, sparkle: 2 };

function overlayMarkup(overlay: Overlay): string {
  const glyph = GLYPHS[overlay];
  const svg = renderSvg(glyph, 'companion-sprite');
  const one = `<span class="companion-glyph" style="--cols: ${glyph[0].length}">${svg}</span>`;
  return one.repeat(GLYPH_COUNT[overlay]);
}

/**
 * 무대 요소 하나에 캐릭터를 그리고 동작을 바꿔 가며 재생합니다.
 * 움직임 줄이기 설정이면 각 동작의 첫 프레임만 보여 줍니다.
 */
export function createSpritePlayer(stage: HTMLElement) {
  const body = document.createElement('div');
  body.className = 'companion-body';
  const overlay = document.createElement('div');
  overlay.className = 'companion-overlay';
  stage.append(body, overlay);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;
  let current: AnimationName | null = null;

  function play(name: AnimationName, { restart = false } = {}) {
    if (name === current && !restart) return;
    current = name;
    window.clearTimeout(timer);

    const animation: { frames: { grid: string[]; ms: number }[]; overlay?: Overlay } = ANIMATIONS[name];
    body.innerHTML = animation.frames.map((frame) => renderSvg(frame.grid)).join('');
    overlay.className = animation.overlay
      ? `companion-overlay companion-overlay--${animation.overlay}`
      : 'companion-overlay';
    overlay.innerHTML = animation.overlay ? overlayMarkup(animation.overlay) : '';

    const sprites = [...body.children] as SVGElement[];
    let index = 0;
    const show = () => {
      sprites.forEach((sprite, i) => sprite.toggleAttribute('hidden', i !== index));
      if (reduced.matches || sprites.length < 2) return;
      timer = window.setTimeout(() => {
        index = (index + 1) % sprites.length;
        show();
      }, animation.frames[index].ms);
    };
    show();
  }

  function stop() {
    window.clearTimeout(timer);
    current = null;
  }

  return {
    play,
    stop,
    get current() {
      return current;
    },
  };
}
