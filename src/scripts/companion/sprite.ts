/**
 * 글 옆을 따라다니는 도트 캐릭터 '새싹'의 원본.
 * 16x18 격자에 문자 하나가 픽셀 하나이고, 문자는 companion.css의 .px-* 색으로 칠합니다.
 * 프레임은 기본 몸에 표정, 팔, 발, 눌림, 높이를 덧붙여 만듭니다.
 */
export const WIDTH = 16;
export const HEIGHT = 18;

// o 외곽선, f 팔다리, g 몸, l 하이라이트, d 그늘, k 눈, w 눈빛, p 볼, m 입, r 입 속, s 잎, t 줄기, b 땀
const BODY = [
  '................',
  '................',
  '......ss.ss.....',
  '.......sts......',
  '........t.......',
  '.....oooooo.....',
  '...oollggggoo...',
  '..olllgggggggo..',
  '.ollggggggggggo.',
  '.olgwkggggwkgdo.',
  '.oggkkggggkkgdo.',
  '.oggkkggggkkgdo.',
  '.oppgggmmgggppo.',
  '.ogggggggggggdo.',
  '..odgggggggddo..',
  '...ooddddddoo...',
  '.....oooooo.....',
  '................',
];

type Grid = string[][];
type Dot = [row: number, col: number, ch: string];

export type Eyes = 'open' | 'blink' | 'sleep' | 'happy' | 'dot';
export type Look = 'center' | 'left' | 'up';
export type Mouth = 'neutral' | 'smile' | 'open' | 'tiny';
export type Feet = 'stand' | 'stepLeft' | 'stepRight' | 'none';
export type Arms = 'none' | 'up' | 'out' | 'waveUp' | 'waveIn';

export type FrameSpec = {
  eyes?: Eyes;
  look?: Look;
  mouth?: Mouth;
  feet?: Feet;
  arms?: Arms;
  /** 0이면 그대로, 1이면 정수리를 한 줄, 2이면 배까지 한 줄 더 눌러 납작하게 만듭니다. */
  squash?: 0 | 1 | 2;
  /** 몸 전체를 위(-)나 아래(+)로 옮깁니다. 발은 바닥에 남습니다. */
  dy?: number;
  /** 잎이 기우는 방향 */
  sprout?: -1 | 0 | 1;
  sweat?: boolean;
};

const EYE_SHAPES: Record<Eyes, Dot[]> = {
  open: [[0, 0, 'w'], [0, 1, 'k'], [1, 0, 'k'], [1, 1, 'k'], [2, 0, 'k'], [2, 1, 'k']],
  blink: [[1, 0, 'k'], [1, 1, 'k']],
  sleep: [[2, -1, 'k'], [2, 0, 'k'], [2, 1, 'k']],
  happy: [[1, -1, 'k'], [0, 0, 'k'], [0, 1, 'k'], [1, 2, 'k']],
  dot: [[1, 0, 'k'], [1, 1, 'k'], [2, 0, 'k'], [2, 1, 'k']],
};

const EYE_ORIGINS: Record<Look, [left: [number, number], right: [number, number]]> = {
  center: [[9, 4], [9, 10]],
  left: [[9, 3], [9, 9]],
  up: [[8, 4], [8, 10]],
};

const MOUTHS: Record<Mouth, Dot[]> = {
  neutral: [[12, 7, 'm'], [12, 8, 'm']],
  smile: [[12, 6, 'm'], [13, 7, 'm'], [13, 8, 'm'], [12, 9, 'm']],
  open: [[12, 6, 'm'], [12, 7, 'm'], [12, 8, 'm'], [12, 9, 'm'], [13, 7, 'r'], [13, 8, 'r']],
  tiny: [[12, 8, 'm']],
};

const ARMS: Record<Arms, Dot[]> = {
  none: [],
  up: [[7, 0, 'f'], [8, 0, 'f'], [7, 15, 'f'], [8, 15, 'f']],
  out: [[11, 0, 'f'], [11, 15, 'f']],
  waveUp: [[11, 0, 'f'], [7, 15, 'f'], [8, 15, 'f']],
  waveIn: [[11, 0, 'f'], [7, 14, 'f'], [8, 15, 'f']],
};

// 발은 몸이 뜨거나 눌려도 바닥(맨 아래 두 줄)에 붙어 있습니다.
const FEET: Record<Feet, Dot[]> = {
  stand: [[17, 4, 'f'], [17, 5, 'f'], [17, 10, 'f'], [17, 11, 'f']],
  stepLeft: [[16, 4, 'f'], [16, 5, 'f'], [17, 4, 'f'], [17, 5, 'f'], [16, 10, 'f'], [16, 11, 'f']],
  stepRight: [[16, 4, 'f'], [16, 5, 'f'], [16, 10, 'f'], [16, 11, 'f'], [17, 10, 'f'], [17, 11, 'f']],
  none: [],
};

const blankRow = () => Array.from({ length: WIDTH }, () => '.');

function put(grid: Grid, dots: Dot[], dr = 0, dc = 0) {
  for (const [r, c, ch] of dots) {
    const row = grid[r + dr];
    if (row && c + dc >= 0 && c + dc < WIDTH) row[c + dc] = ch;
  }
}

function fill(grid: Grid, rows: number[], cols: number[], ch: string) {
  for (const r of rows) for (const c of cols) grid[r][c] = ch;
}

function tiltRow(row: string[], by: number): string[] {
  if (by === 0) return row;
  const moved = blankRow();
  row.forEach((ch, c) => {
    if (ch !== '.' && c + by >= 0 && c + by < WIDTH) moved[c + by] = ch;
  });
  return moved;
}

// 지운 줄만큼 위에 빈 줄을 채워 바닥은 그대로 두고 몸만 낮아지게 합니다.
function removeRows(grid: Grid, rows: number[]): Grid {
  const kept = grid.filter((_, r) => !rows.includes(r));
  return [...rows.map(blankRow), ...kept];
}

function shiftRows(grid: Grid, dy: number): Grid {
  if (dy === 0) return grid;
  const out = Array.from({ length: HEIGHT }, blankRow);
  grid.forEach((row, r) => {
    if (r + dy >= 0 && r + dy < HEIGHT) out[r + dy] = row;
  });
  return out;
}

export function buildFrame(spec: FrameSpec = {}): string[] {
  const {
    eyes = 'open', look = 'center', mouth = 'neutral', feet = 'stand', arms = 'none',
    squash = 0, dy = 0, sprout = 0, sweat = false,
  } = spec;
  let grid: Grid = BODY.map((row) => row.split(''));

  grid[2] = tiltRow(grid[2], sprout);

  fill(grid, [8, 9, 10, 11], [3, 4, 5, 6, 9, 10, 11, 12], 'g');
  const shape = EYE_SHAPES[eyes];
  for (const [r, c] of EYE_ORIGINS[look]) put(grid, shape, r, c);

  fill(grid, [12, 13], [6, 7, 8, 9], 'g');
  put(grid, MOUTHS[mouth]);
  put(grid, ARMS[arms]);
  if (sweat) put(grid, [[6, 14, 'b'], [7, 14, 'b']]);

  if (squash === 1) grid = removeRows(grid, [8]);
  if (squash === 2) grid = removeRows(grid, [8, 14]);
  grid = shiftRows(grid, dy);
  put(grid, FEET[feet]);

  return grid.map((row) => row.join(''));
}

export type Overlay = 'zzz' | 'alert' | 'sparkle';

export type Animation = {
  label: string;
  /** 언제 이 동작을 쓰는지 */
  when: string;
  frames: { grid: string[]; ms: number }[];
  overlay?: Overlay;
};

const f = (spec: FrameSpec, ms: number) => ({ grid: buildFrame(spec), ms });

export const ANIMATIONS = {
  idle: {
    label: '숨쉬기',
    when: '읽는 중이고 스크롤이 잠깐 멈췄을 때',
    frames: [
      f({}, 900),
      f({ squash: 1 }, 600),
      f({}, 900),
      f({ eyes: 'blink' }, 110),
      f({}, 500),
      f({ squash: 1 }, 600),
    ],
  },
  walk: {
    label: '걷기',
    when: '천천히 스크롤할 때',
    frames: [
      f({ sprout: 1 }, 150),
      f({ dy: -1, feet: 'stepLeft' }, 150),
      f({ sprout: -1 }, 150),
      f({ dy: -1, feet: 'stepRight' }, 150),
    ],
  },
  run: {
    label: '달리기',
    when: '빠르게 넘길 때',
    frames: [
      f({ sprout: 1, sweat: true, mouth: 'open' }, 80),
      f({ dy: -1, feet: 'stepLeft', sprout: 1, sweat: true, mouth: 'open' }, 80),
      f({ sprout: -1, sweat: true, mouth: 'open' }, 80),
      f({ dy: -1, feet: 'stepRight', sprout: -1, sweat: true, mouth: 'open' }, 80),
    ],
  },
  sit: {
    label: '앉기',
    when: '몇 초 동안 스크롤이 없을 때',
    frames: [
      f({ squash: 1, dy: 1, feet: 'none', mouth: 'smile' }, 1300),
      f({ squash: 1, dy: 1, feet: 'none', mouth: 'smile', eyes: 'blink' }, 110),
      f({ squash: 1, dy: 1, feet: 'none', mouth: 'smile' }, 900),
      f({ squash: 2, dy: 1, feet: 'none', mouth: 'smile' }, 700),
    ],
  },
  watch: {
    label: '데모 구경',
    when: '본문의 데모가 재생 중일 때',
    frames: [
      f({ squash: 1, dy: 1, feet: 'none', look: 'left' }, 1500),
      f({ squash: 1, dy: 1, feet: 'none', look: 'left', eyes: 'blink' }, 110),
      f({ squash: 1, dy: 1, feet: 'none', look: 'left' }, 1100),
      f({ squash: 1, dy: 1, feet: 'none', look: 'left', mouth: 'open' }, 500),
    ],
  },
  sleep: {
    label: '잠자기',
    when: '오래 멈춰 있을 때',
    overlay: 'zzz',
    frames: [
      f({ squash: 2, dy: 1, feet: 'none', eyes: 'sleep', mouth: 'tiny', sprout: -1 }, 1100),
      f({ squash: 1, dy: 1, feet: 'none', eyes: 'sleep', mouth: 'tiny', sprout: -1 }, 1100),
    ],
  },
  alert: {
    label: '깜짝',
    when: '갑자기 크게 이동했을 때 (목차 클릭 등)',
    overlay: 'alert',
    frames: [
      f({ eyes: 'dot', mouth: 'open', arms: 'out' }, 140),
      f({ eyes: 'dot', mouth: 'open', arms: 'up', dy: -2, feet: 'none' }, 260),
      f({ eyes: 'dot', mouth: 'open', arms: 'out' }, 600),
    ],
  },
  cheer: {
    label: '완독 축하',
    when: '글 끝까지 읽었을 때',
    overlay: 'sparkle',
    frames: [
      f({ eyes: 'happy', mouth: 'open', arms: 'up', dy: -2, feet: 'none', sprout: 1 }, 200),
      f({ eyes: 'happy', mouth: 'open', arms: 'out' }, 200),
      f({ eyes: 'happy', mouth: 'open', arms: 'up', dy: -2, feet: 'none', sprout: -1 }, 200),
      f({ eyes: 'happy', mouth: 'smile', arms: 'out', squash: 1 }, 260),
    ],
  },
  wave: {
    label: '인사',
    when: '글을 처음 열었을 때',
    frames: [
      f({ eyes: 'happy', mouth: 'smile', arms: 'waveUp' }, 240),
      f({ eyes: 'happy', mouth: 'smile', arms: 'waveIn' }, 240),
    ],
  },
} satisfies Record<string, Animation>;

export type AnimationName = keyof typeof ANIMATIONS;

// 머리 위에 떠오르는 작은 기호. 몸과 같은 문자 규칙을 씁니다.
export const GLYPHS: Record<Overlay, string[]> = {
  zzz: ['kkkkk', '...k.', '..k..', '.k...', 'kkkkk'],
  alert: ['k', 'k', 'k', '.', 'k'],
  sparkle: ['.y.', 'yyy', '.y.'],
};

/** 같은 색이 이어진 가로 구간을 path 하나로 묶어 SVG 문자열을 만듭니다. */
export function renderSvg(grid: string[], className = 'companion-sprite'): string {
  const runs = new Map<string, string[]>();
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      if (ch !== '.') {
        const list = runs.get(ch) ?? [];
        list.push(`M${x} ${y}h${end - x}v1h${x - end}z`);
        runs.set(ch, list);
      }
      x = end;
    }
  });
  const width = grid[0]?.length ?? 0;
  const paths = [...runs].map(([ch, d]) => `<path class="px-${ch}" d="${d.join('')}"/>`).join('');
  return `<svg class="${className}" viewBox="0 0 ${width} ${grid.length}" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`;
}
