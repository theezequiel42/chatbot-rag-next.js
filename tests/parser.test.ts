// Simple parser tests for '|||' bubbles and visual markers [[img:...]] / [[icon:...]]

const splitBubbles = (text: string): string[] => text.split('|||').map(s => s.trim()).filter(Boolean);

const extractTokens = (text: string) => {
  const tokens: Array<{ type: 'text' | 'img' | 'icon'; value?: string }> = [];
  const pattern = /\[\[(img|icon):([a-zA-Z0-9_-]+)\]\]/g;
  let idx = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const [full, kind, value] = match;
    const before = text.slice(idx, match.index).trim();
    if (before) tokens.push({ type: 'text', value: before });
    tokens.push({ type: kind as 'img' | 'icon', value });
    idx = match.index + full.length;
  }
  const tail = text.slice(idx).trim();
  if (tail) tokens.push({ type: 'text', value: tail });
  return tokens;
};

console.log('parser: bubbles and markers');

const resp = 'Olá!|||[[icon:RiHandHeartLine]]|||Posso ajudar.|||' ;
const bubbles = splitBubbles(resp);
if (bubbles.length !== 3) throw new Error('Expected 3 bubbles');

const tokens = extractTokens('Texto antes [[img:fisica]] e depois [[icon:RiLeafLine]] fim');
if (tokens.length !== 4) throw new Error('Expected 4 tokens');
if (tokens[0].type !== 'text' || tokens[1].type !== 'img' || tokens[2].type !== 'text' || tokens[3].type !== 'icon') {
  throw new Error('Token sequence mismatch');
}

console.log('parser: OK');

