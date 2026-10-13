import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn, copyText } from '@/lib/utils'

type Lang = 'js' | 'sh' | 'sql' | 'text'

const KEYWORDS: Record<Lang, string[]> = {
  js: ['import', 'from', 'const', 'let', 'await', 'async', 'export', 'return', 'function', 'new', 'if', 'else', 'true', 'false', 'null'],
  sql: [
    'create', 'table', 'primary', 'key', 'not', 'null', 'default', 'references', 'alter', 'add', 'column', 'drop', 'index', 'on', 'update', 'set', 'where',
    'and', 'or', 'is', 'any', 'array', 'ilike', 'unique', 'rename', 'to', 'if', 'exists', 'delete', 'insert', 'into', 'values',
  ],
  sh: ['npx', 'npm', 'cubby'],
  text: [],
}

const TYPES = ['uuid', 'text', 'int', 'bool', 'timestamp', 'date', 'real', 'json', 'jsonb', 'cubby_user', 'integer', 'boolean']

function highlight(code: string, lang: Lang): ReactNode[] {
  if (lang === 'text') return [code]
  const comment = lang === 'sql' ? /--.*$/ : lang === 'sh' ? /#.*$/ : /\/\/.*$/
  const out: ReactNode[] = []
  code.split('\n').forEach((line, li) => {
    if (li > 0) out.push('\n')
    const cm = line.match(comment)
    const body = cm ? line.slice(0, cm.index) : line
    const re = /('[^']*'|"[^"]*"|`[^`]*`|\b\w+\b|[^\w'"`]+)/g
    let m: RegExpExecArray | null
    let k = 0
    while ((m = re.exec(body))) {
      const tok = m[0]
      const key = `${li}-${k++}`
      if (/^['"`]/.test(tok)) out.push(<span key={key} className="text-lime">{tok}</span>)
      else if (KEYWORDS[lang].includes(tok.toLowerCase())) out.push(<span key={key} className="text-bubblegum">{tok}</span>)
      else if (lang === 'sql' && TYPES.includes(tok.toLowerCase())) out.push(<span key={key} className="text-sky">{tok}</span>)
      else if (/^\d+$/.test(tok)) out.push(<span key={key} className="text-tangerine">{tok}</span>)
      else if (lang === 'js' && /^[a-z]\w*$/i.test(tok) && body[m.index + tok.length] === '(') out.push(<span key={key} className="text-sky">{tok}</span>)
      else out.push(tok)
    }
    if (cm) out.push(<span key={`${li}-c`} className="text-paper/45 italic">{cm[0]}</span>)
  })
  return out
}

export function CodeBlock({ code, lang = 'js', title, className, wrap = false }: { code: string; lang?: Lang; title?: string; className?: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={cn('brut overflow-hidden rounded-2xl bg-ink text-paper', className)}>
      <div className="flex items-center justify-between gap-2 border-b-2 border-paper/15 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full border-2 border-paper/30 bg-cherry" />
          <span className="size-3 rounded-full border-2 border-paper/30 bg-sun" />
          <span className="size-3 rounded-full border-2 border-paper/30 bg-mint" />
          {title && <span className="ml-2 font-mono text-xs text-paper/60">{title}</span>}
        </div>
        <button
          onClick={() => {
            copyText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-paper/70 hover:bg-paper/10 hover:text-paper"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className={cn('overflow-x-auto p-4 font-mono text-[13px] leading-relaxed', wrap && 'whitespace-pre-wrap')}>
        <code>{highlight(code, lang)}</code>
      </pre>
    </div>
  )
}
