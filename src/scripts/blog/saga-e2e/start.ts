import { createScene, duration, svg, setAttrs, watchNarrow, lerp, exitPoint, type Point } from '../scene/core';
import { createNode } from '../scene/parts';

export function initSagaStart(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = 'true';
  const canvas = root.querySelector<SVGSVGElement>('svg')!;
  const status = root.querySelector<HTMLElement>('[role="status"]')!;
  const solution = root.dataset.solution === 'true';
  let method = solution ? 4 : 0;
  let narrow = false;
  const labels = ['컨트롤러', '상태 변경', 'publisher', 'outbox', 'poller', 'Kafka'];
  const lines = Array.from({length:5}, () => svg('path', {class:'saga-wire'}, canvas));
  const nodes = labels.map((label,i) => createNode(canvas, {label, hue:i===5?'var(--scene-hue-gray)':'var(--scene-hue-violet)'}));
  nodes.forEach(node=>node.group.classList.add('is-sans-sub'));
  const packet = svg('circle', {r:6, class:'saga-token'}, canvas);
  const badge = svg('text', {class:'saga-label'}, canvas);
  const notes = [
    'Kafka에 바로 도착합니다. 결제 상태 변경·직렬화·outbox·poller는 확인하지 않습니다.',
    'outbox의 payload는 테스트가 작성합니다. poller는 지나가지만 publisher의 직렬화는 확인하지 않습니다.',
    '계획상의 runner는 publisher부터 호출합니다. 인증·업무 진입점을 우회하는 스위치가 운영 이미지에 남습니다.',
    'E2E 전용 코드가 운영 bootJar 밖에 있습니다. 컨테이너 안에서는 실행할 수 없습니다.',
    '컨트롤러부터 Kafka까지 지납니다. 시작용 새 운영 코드·모듈·스위치 없이 기존 DUAL_ACCEPT 모드를 씁니다.'
  ];
  const entry = () => [5, 3, 2, 2, 0][method];
  const points = (): Point[] => narrow
    ? [{x:90,y:52},{x:270,y:52},{x:270,y:163},{x:90,y:163},{x:90,y:274},{x:270,y:274}]
    : [{x:92,y:60},{x:280,y:60},{x:468,y:60},{x:468,y:195},{x:280,y:195},{x:92,y:195}];
  const scene = createScene({cursor:5, completion:1}, state => {
    const pts=points();
    setAttrs(canvas, {viewBox:`0 0 ${narrow ? 360 : 560} ${narrow ? 340 : 270}`});
    lines.forEach((line,i) => {
      const a=exitPoint({...pts[i],w:narrow?150:164,h:58},pts[i+1]);
      const b=exitPoint({...pts[i+1],w:narrow?150:164,h:58},pts[i]);
      setAttrs(line,{d:`M${a.x} ${a.y} L${b.x} ${b.y}`, opacity:method === 3 || i<entry() ? .18 : 1});
      line.classList.toggle('is-flow', method!==3 && i>=entry() && state.cursor>=i+1);
    });
    nodes.forEach((node,i) => {
      node.setBox({...pts[i],w:narrow ? 150:164,h:58});
      const bypass=method===3 || i<entry();
      const inserted=method===1 && i===3;
      const done=!bypass && state.cursor>=i;
      node.group.style.opacity=bypass ? '.65':'1';
      node.group.classList.toggle('is-done',done && !inserted);
      node.setSub(method===3 ? '실행 안 됨' : bypass ? '우회' : inserted ? '테스트가 작성' : done ? '실제 실행' : '입력 대기');
    });
    const i=Math.min(4,Math.floor(state.cursor));
    const t=state.cursor-i;
    setAttrs(packet,{cx:lerp(pts[i].x,pts[i+1].x,t),cy:lerp(pts[i].y,pts[i+1].y,t)+31,opacity:method===3 ? 0:1});
    setAttrs(badge,{x:narrow ? 180:280,y:narrow ? 329:257});
    badge.textContent=method===3 ? '실행 불가: bootJar에 runner 코드 없음' : state.completion<1 ? '입력이 경로를 지나는 중' : '초록 테두리는 실제로 실행한 구간, 흐린 구간은 우회';
  });
  async function run(instant=false) {
    const alive=scene.begin();
    root.querySelectorAll<HTMLButtonElement>('[data-method]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.method)===method)));
    status.textContent=notes[method];
    if(instant || scene.reduced || method===3) {scene.set({cursor:5,completion:1}); return;}
    scene.set({cursor:entry(),completion:0});
    for(let i=entry()+1;i<=5;i++) {
      await scene.go({cursor:i,completion:0},duration.fly); if(!alive()) return;
    }
    await scene.go({cursor:5,completion:1},duration.snap); if(!alive()) return;
  }
  root.querySelectorAll<HTMLButtonElement>('[data-method]').forEach(b=>b.addEventListener('click',()=>{method=Number(b.dataset.method);void run();}));
  root.querySelector('.saga-replay')!.addEventListener('click',()=>void run());
  watchNarrow(root,n=>{narrow=n;scene.redraw();});
  void run(true);
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();void run();}},{threshold:.4});
  observer.observe(root);
}
