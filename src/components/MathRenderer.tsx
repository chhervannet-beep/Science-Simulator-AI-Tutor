import React from "react";

// Helper to extract content inside matching braces {}
function findBracesContent(str: string, startIndex: number): { content: string, nextIndex: number } | null {
  let depth = 0;
  let content = "";
  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    if (char === '{') {
      if (depth > 0) content += char;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return { content, nextIndex: i + 1 };
      }
      content += char;
    } else {
      if (depth > 0) {
        content += char;
      }
    }
  }
  return null;
}

export function parseFormula(formula: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    // Check for LaTeX commands starting with \
    if (char === '\\') {
      // Extract command name
      let cmd = "";
      let j = i + 1;
      while (j < formula.length && /[a-zA-Z]/.test(formula[j])) {
        cmd += formula[j];
        j++;
      }

      if (cmd === "frac") {
        i = j;
        // Parse numerator
        while (i < formula.length && formula[i] !== '{') i++;
        const numRes = findBracesContent(formula, i);
        if (numRes) {
          i = numRes.nextIndex;
          // Parse denominator
          while (i < formula.length && formula[i] !== '{') i++;
          const denRes = findBracesContent(formula, i);
          if (denRes) {
            i = denRes.nextIndex;
            result.push(
              <span key={`frac-${i}`} className="inline-flex flex-col items-center justify-center align-middle mx-1">
                <span className="text-[11px] leading-none pb-0.5 border-b border-slate-500 text-center w-full px-0.5">
                  {parseFormula(numRes.content)}
                </span>
                <span className="text-[11px] leading-none pt-0.5 text-center w-full px-0.5">
                  {parseFormula(denRes.content)}
                </span>
              </span>
            );
            continue;
          }
        }
      } else if (cmd === "lim") {
        i = j;
        // Check if followed by subscript _
        let sub = "";
        if (i < formula.length && formula[i] === '_') {
          i++;
          if (formula[i] === '{') {
            const subRes = findBracesContent(formula, i);
            if (subRes) {
              sub = subRes.content;
              i = subRes.nextIndex;
            }
          } else {
            sub = formula[i];
            i++;
          }
        }
        result.push(
          <span key={`lim-${i}`} className="inline-flex flex-col items-center justify-center align-middle mx-1">
            <span className="text-xs font-serif italic font-bold text-teal-300 leading-none">lim</span>
            {sub && (
              <span className="text-[9px] text-slate-400 leading-none scale-90 origin-top mt-0.5 font-sans whitespace-nowrap">
                {parseFormula(sub)}
              </span>
            )}
          </span>
        );
        continue;
      } else if (cmd === "sum" || cmd === "int") {
        i = j;
        let sub = "";
        let sup = "";

        // Parse possible subscript or superscript
        for (let loop = 0; loop < 2; loop++) {
          if (i < formula.length && formula[i] === '_') {
            i++;
            if (formula[i] === '{') {
              const subRes = findBracesContent(formula, i);
              if (subRes) {
                sub = subRes.content;
                i = subRes.nextIndex;
              }
            } else {
              sub = formula[i];
              i++;
            }
          } else if (i < formula.length && formula[i] === '^') {
            i++;
            if (formula[i] === '{') {
              const supRes = findBracesContent(formula, i);
              if (supRes) {
                sup = supRes.content;
                i = supRes.nextIndex;
              }
            } else {
              sup = formula[i];
              i++;
            }
          }
        }

        if (cmd === "sum") {
          result.push(
            <span key={`sum-${i}`} className="inline-flex flex-col items-center justify-center align-middle mx-1">
              {sup && <span className="text-[8px] text-slate-400 leading-none mb-0.5 font-sans">{parseFormula(sup)}</span>}
              <span className="text-base font-serif leading-none font-medium text-teal-400">∑</span>
              {sub && <span className="text-[8px] text-slate-400 leading-none mt-0.5 font-sans">{parseFormula(sub)}</span>}
            </span>
          );
        } else {
          result.push(
            <span key={`int-${i}`} className="inline-flex items-center align-middle mx-1">
              <span className="text-xl font-serif italic text-teal-400 leading-none">∫</span>
              {(sub || sup) && (
                <span className="inline-flex flex-col justify-between text-[8px] text-slate-400 h-5 pl-0.5 leading-none font-sans">
                  <span className="h-2 flex items-start">{sup ? parseFormula(sup) : ""}</span>
                  <span className="h-2 flex items-end">{sub ? parseFormula(sub) : ""}</span>
                </span>
              )}
            </span>
          );
        }
        continue;
      }

      // Handle simple symbols
      const symbols: Record<string, string> = {
        Delta: "Δ",
        to: "→",
        rightarrow: "→",
        infty: "∞",
        theta: "θ",
        pi: "π",
        sigma: "σ",
        mu: "μ",
        alpha: "α",
        beta: "β",
        quad: "    ",
        qquad: "        ",
      };

      if (symbols[cmd] !== undefined) {
        result.push(<span key={`symbol-${i}`} className="font-sans mx-0.5 text-slate-200">{symbols[cmd]}</span>);
        i = j;
        continue;
      } else if (cmd === "") {
        // This is a special single char escape, like \, or \ 
        const nextChar = formula[j];
        if (nextChar === "," || nextChar === " ") {
          result.push(<span key={`space-${i}`} className="mx-0.5">&nbsp;</span>);
          i = j + 1;
          continue;
        }
      }

      // If we don't recognize it, just render the backslash and keep parsing
      result.push(<span key={`bs-${i}`}>\</span>);
      i++;
      continue;
    }

    // Subscripts & Superscripts on normal characters
    if (char === '_') {
      i++;
      let content = "";
      if (i < formula.length && formula[i] === '{') {
        const subRes = findBracesContent(formula, i);
        if (subRes) {
          content = subRes.content;
          i = subRes.nextIndex;
        }
      } else if (i < formula.length) {
        content = formula[i];
        i++;
      }
      result.push(<sub key={`sub-${i}`} className="text-[8px] align-sub leading-none text-slate-400">{parseFormula(content)}</sub>);
      continue;
    }

    if (char === '^') {
      i++;
      let content = "";
      if (i < formula.length && formula[i] === '{') {
        const supRes = findBracesContent(formula, i);
        if (supRes) {
          content = supRes.content;
          i = supRes.nextIndex;
        }
      } else if (i < formula.length) {
        content = formula[i];
        i++;
      }
      result.push(<sup key={`sup-${i}`} className="text-[8px] align-super leading-none text-slate-300">{parseFormula(content)}</sup>);
      continue;
    }

    // Normal characters
    result.push(
      <span 
        key={`char-${i}`} 
        className={/[a-zA-Z]/.test(char) ? "font-serif italic text-slate-200 mx-[0.5px]" : "font-sans text-slate-300 mx-[0.5px]"}
      >
        {char}
      </span>
    );
    i++;
  }

  return result;
}

interface MathBlockProps {
  formula: string;
  block?: boolean;
  key?: any;
}

export default function MathRenderer({ formula, block = false }: MathBlockProps) {
  const cleanFormula = formula.trim();
  const parsed = parseFormula(cleanFormula);

  if (block) {
    return (
      <div className="my-3 py-2.5 px-4 bg-slate-950/70 border border-white/10 rounded-xl flex items-center justify-center overflow-x-auto scrollbar-none shadow-inner max-w-full font-mono text-sm leading-relaxed tracking-wide select-all pointer-events-auto">
        <div className="flex items-center gap-1 flex-wrap justify-center py-0.5">
          {parsed}
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs leading-none bg-slate-950/40 px-1 py-0.5 rounded border border-white/5 mx-0.5 select-all align-middle">
      {parsed}
    </span>
  );
}
