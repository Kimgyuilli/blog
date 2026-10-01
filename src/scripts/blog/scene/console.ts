/**
 * `.scene-console` 목록에 실행 로그를 한 줄씩 붙입니다.
 * tone: step(›) · pending(…) · ok(✓) · fail(✕) · warn(!) · trace(들여쓴 오류 본문)
 */
export type Tone = 'step' | 'pending' | 'ok' | 'fail' | 'warn' | 'trace';

export function createConsole(list: HTMLOListElement, idleText: string) {
  const idle = () => {
    const line = document.createElement('li');
    line.className = 'scene-console-idle';
    line.textContent = idleText;
    list.replaceChildren(line);
  };
  idle();

  return {
    /** 한 줄을 붙이고, 그 줄을 나중에 바꾸는 함수를 돌려줍니다(대기 중 → 성공/실패). */
    log(text: string, tone: Tone = 'step') {
      list.querySelector('.scene-console-idle')?.remove();
      const line = document.createElement('li');
      line.dataset.tone = tone;
      line.textContent = text;
      list.append(line);
      return (nextText: string, nextTone: Tone) => {
        line.textContent = nextText;
        line.dataset.tone = nextTone;
      };
    },
    clear: () => list.replaceChildren(),
    reset: idle,
  };
}
