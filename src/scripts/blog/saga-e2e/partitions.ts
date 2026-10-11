import { createScene, duration, svg, setAttrs, watchNarrow, lerp, bumpText } from '../scene/core';
import { createNode } from '../scene/parts';
import { createStepPlayer } from '../scene/step-player';

export function initSagaPartitions(root:HTMLElement) {
  if(root.dataset.ready) return;
  root.dataset.ready='true';
  const canvas=root.querySelector<SVGSVGElement>('svg')!;
  const status=root.querySelector<HTMLElement>('[role="status"]')!;
  let pre=false, narrow=false, step=0;
  const connections=[0,1,2].map(()=>svg('path',{class:'saga-wire'},canvas));
  const nodes=[0,1,2].map(i=>createNode(canvas,{label:`파티션 ${i}`,hue:'var(--scene-hue-gray)'}));
  const consumer=createNode(canvas,{label:'consumer',hue:'var(--scene-hue-amber)'});
  [...nodes,consumer].forEach(node=>node.group.classList.add('is-sans-sub'));
  const tokens=['8개 · P0','22개 · P1·2'].map(label=>{
    const g=svg('g',{},canvas);
    svg('rect',{x:-51,y:-13,width:102,height:26,rx:9,class:'saga-chip'},g);
    const text=svg('text',{y:4,class:'saga-label'},g);text.textContent=label;
    return g;
  });
  const assigned=svg('text',{class:'saga-label'},canvas);
  const clock=svg('text',{class:'saga-caption'},canvas);
  const total=svg('text',{class:'saga-label'},canvas);
  const target=()=>({expanded:pre || step>=1 ? 1:0, assigned:pre || step>=3 ? 1:0, sent:step>=2 ? 1:0, flow0:step>=2 ? 1:0, flow12:step>=2 && (pre || step>=3) ? 1:0});
  const scene=createScene(target(),s=>{
    const width=narrow?360:560;
    const xs=narrow?[60,180,300]:[90,280,470];
    const center=width/2;
    setAttrs(canvas,{viewBox:`0 0 ${width} 412`});
    nodes.forEach((node,i)=>{
      node.setBox({x:xs[i],y:58,w:narrow?108:162,h:58});
      const exists=i===0 || s.expanded>.99;
      node.group.style.opacity=String(i===0?1:.65+.35*s.expanded);
      node.setSub(!exists?'아직 없음':i===0 || s.assigned>.99?'할당됨':'할당 전');
      node.group.classList.toggle('is-waiting',exists && i>0 && s.assigned<.99);
      node.group.classList.toggle('is-done',exists && (i===0 || s.assigned>.99));
      setAttrs(connections[i],{d:`M${xs[i]} 90 L${xs[i]} 250 L${center} 285`,opacity:i===0?1:.15+.85*s.assigned});
      connections[i].classList.toggle('is-flow',i===0 || s.assigned>.99);
      connections[i].classList.toggle('is-wait',i>0 && s.assigned<.99);
    });
    consumer.setBox({x:center,y:315,w:190,h:60});
    consumer.setSub(s.assigned>.99?'할당 (0, 1, 2)':'할당 (0)');
    const count=(s.sent>.99 && s.flow0>.99?8:0)+(s.sent>.99 && s.flow12>.99?22:0);
    bumpText(total,`소비 완료 ${count} / 30`);
    setAttrs(total,{x:center,y:399});
    const startX=[xs[0],(xs[1]+xs[2])/2];
    tokens.forEach((token,i)=>{
      const flow=i===0?s.flow0:s.flow12;
      setAttrs(token,{transform:`translate(${lerp(startX[i],center+(i===0?-50:50),flow)} ${lerp(190,275,flow)})`,opacity:s.sent});
      token.querySelector('rect')!.style.stroke=flow>.99?'var(--scene-flow)':'var(--scene-temp)';
    });
    setAttrs(assigned,{x:center,y:15});
    assigned.textContent=s.expanded>.99?'브로커에는 파티션 3개':'브로커가 파티션 1개 자동 생성';
    setAttrs(clock,{x:center,y:371});
    clock.textContent=pre?'사전 생성: 구독할 때부터 전체 할당':step>=3?'실험 t+289초 · 메타데이터 갱신':step>=2?'실험 t+0초 · 새 파티션 할당 대기':'파티션이 있어도 할당은 따로';
  });
  const notes=()=>pre?[
    '구독 전에 3파티션이 존재합니다. consumer가 처음부터 (0, 1, 2)를 할당받습니다.',
    '앱의 선언과 이미 같은 파티션 수입니다. 뒤늦게 늘어나는 파티션이 없습니다.',
    '비교 실험에서는 키 30개가 모두 즉시 소비됐습니다.',
    '이 비교 실험에는 새 파티션을 뒤늦게 발견할 때까지 기다리는 구간이 없습니다.'
  ][step]:[
    '없는 토픽을 먼저 구독하자 1파티션이 자동 생성되고, consumer는 (0)만 할당받았습니다.',
    '브로커 파티션은 3개로 늘었지만 consumer는 아직 (0)만 할당받은 상태입니다.',
    '파티션 0의 8개만 소비했습니다. 파티션 1·2의 22개는 남아 있습니다.',
    '이 실험에서는 약 289초 뒤 할당이 (0, 1, 2)로 바뀌며 나머지 22개를 소비했습니다.'
  ][step];
  function show(instant=false){status.textContent=notes();if(instant)scene.set(target());else void scene.go(target(),duration.draw);}
  watchNarrow(root,n=>{narrow=n;scene.redraw();});
  createStepPlayer(root,{dwell:()=>duration.dwellLast,onStep:(i,instant)=>{step=i;show(instant);}});
  root.querySelectorAll<HTMLButtonElement>('[data-pre]').forEach(b=>b.addEventListener('click',()=>{
    pre=b.dataset.pre==='1';
    root.querySelectorAll<HTMLButtonElement>('[data-pre]').forEach(btn=>btn.setAttribute('aria-pressed',String((btn.dataset.pre==='1')===pre)));
    root.querySelector<HTMLButtonElement>(`[data-step="${step}"]`)!.click();
    show();
  }));
}
