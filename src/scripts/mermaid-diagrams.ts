type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  run: (config: { nodes: HTMLElement[] }) => Promise<void>;
};

function findMermaidBlocks(body: HTMLElement) {
  return Array.from(body.querySelectorAll<HTMLPreElement>('pre')).filter((pre) => {
    const language = pre.dataset.language?.toLowerCase();
    const code = pre.querySelector('code');
    return language === 'mermaid' || code?.className.toLowerCase().includes('language-mermaid');
  });
}

// Mermaid diagrams.
export async function setupMermaidDiagrams() {
  const body = document.querySelector<HTMLElement>('.article-body');
  if (!body) return;

  const blocks = findMermaidBlocks(body);
  if (blocks.length === 0) return;

  const diagrams = blocks.map((pre) => {
    const diagram = document.createElement('div');
    diagram.className = 'mermaid-diagram mermaid';
    diagram.textContent = pre.textContent?.trim() ?? '';
    pre.replaceWith(diagram);
    return diagram;
  });

  try {
    const mermaidUrl = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    const module = (await import(/* @vite-ignore */ mermaidUrl)) as
      | { default: MermaidApi }
      | MermaidApi;
    const mermaid = 'default' in module ? module.default : module;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'default',
    });
    await mermaid.run({ nodes: diagrams });
  } catch (error) {
    console.error('Mermaid rendering failed', error);
    diagrams.forEach((diagram) => {
      diagram.classList.add('mermaid-diagram-error');
    });
  }
}
