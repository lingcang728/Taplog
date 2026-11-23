#!/usr/bin/env python3
"""扫描讲座字幕（SRT，中文或英文自动识别），找出“回指前文 / 补条件 / 纠正 / 问答”等可能是远距离补充的句子。

用法：
    python3 scan_caveats.py 字幕1.srt [字幕2.srt ...] [-o 输出.md]

输出一份 Markdown 表：时间、类别、命中句及前后各一句。
只负责“找候选”，每条命中都要人工判断：它补充的是哪个结论、那个结论在几分几秒、隔了多久。
"""
import argparse
import re
import sys
from pathlib import Path

# 类别 -> 关键词正则。只收“强信号”，避免“但是”“however”这类太常见的词淹没结果。
PATTERNS_ZH = {
    "回指前文": r"(前面|刚才|之前|上面|开头|一开始)(我们)?(说|讲|提|介绍)(到|过|的)?",
    "补条件": r"(需要注意|要注意的是|注意一下|但是要注意|除非|前提是|只适用|不适用|只有在|只在.{0,6}(时|情况)|有个限制|有一个限制|例外|并不是所有|不是所有)",
    "纠正": r"(纠正|更正|说错|讲错|不太对|不完全对|其实不是|其实并不|准确地说|严格来说|严格地说)",
    "问答": r"(有(同学|老师|朋友|人)(问|提)|提问|问题是说|回答一下)",
}
PATTERNS_EN = {
    "回指前文": r"\b(as (i|we) (said|mentioned|saw|discussed)|(i|we) (said|mentioned|talked about) (this )?(earlier|before)|earlier (i|we) (said|mentioned|saw)|going back to|recall that|remember (when|that) (i|we))\b",
    "补条件": r"\b(be careful|keep in mind|note that|caveat|only (applies|works|relevant|holds|if|when)|unless|as long as|provided that|doesn't (always )?(apply|work)|not always|except (when|for|if)|with one exception|limitation)\b",
    "纠正": r"\b(i misspoke|i was wrong|that's not (quite )?right|not quite right|let me correct|correction|to be (more )?precise|strictly speaking|actually,? (that|this|it)'?s? not|i should (have said|clarify)|let me clarify)\b",
    "问答": r"\b(good question|great question|(someone|somebody) (asked|is asking)|the question (is|was)|any questions|to answer (your|the|that) question)\b",
}

TS = re.compile(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->")


def parse_srt(path: Path):
    blocks = re.split(r"\n\s*\n", path.read_text(encoding="utf-8-sig").strip())
    out = []
    for b in blocks:
        lines = [l.strip() for l in b.splitlines() if l.strip()]
        ts_idx = next((i for i, l in enumerate(lines) if TS.search(l)), None)
        if ts_idx is None:
            continue
        h, m, s, _ = map(int, TS.search(lines[ts_idx]).groups())
        text = " ".join(lines[ts_idx + 1:])
        if text:
            out.append((h * 3600 + m * 60 + s, text))
    return out


def fmt(sec: int) -> str:
    return f"{sec // 60:02d}:{sec % 60:02d}"


def is_chinese(subs) -> bool:
    sample = "".join(t for _, t in subs[:200])
    cjk = sum(1 for ch in sample if "\u4e00" <= ch <= "\u9fff")
    return cjk > len(sample) * 0.2


def scan(path: Path):
    subs = parse_srt(path)
    pats = PATTERNS_ZH if is_chinese(subs) else PATTERNS_EN
    compiled = {k: re.compile(v, re.IGNORECASE) for k, v in pats.items()}
    hits = []
    for i, (t, text) in enumerate(subs):
        cats = [k for k, rx in compiled.items() if rx.search(text)]
        if cats:
            prev = subs[i - 1][1] if i > 0 else ""
            nxt = subs[i + 1][1] if i + 1 < len(subs) else ""
            hits.append((t, "、".join(cats), prev, text, nxt))
    duration = subs[-1][0] if subs else 0
    return subs, duration, hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("srt", nargs="+")
    ap.add_argument("-o", "--output")
    args = ap.parse_args()

    md = ["# 字幕扫描结果：可能的远距离补充", "",
          "由 `Project/tools/scan_caveats.py` 生成。每条都要人工判断：它补充的是哪个结论？那个结论在几分几秒？隔了几分钟？",
          "判断后把“远距离补充”（间隔 ≥5 分钟）填进素材登记表。", ""]
    for p in map(Path, args.srt):
        subs, dur, hits = scan(p)
        md += [f"## {p.stem}", "",
               f"- 句数：{len(subs)}　时长：约 {fmt(dur)}　命中：{len(hits)} 条", ""]
        if hits:
            md += ["| 时间 | 类别 | 上一句 | **命中句** | 下一句 | 原结论在几分几秒 | 间隔（分钟） | 是否算远距离补充 |",
                   "|---|---|---|---|---|---|---|---|"]
            for t, cat, prev, text, nxt in hits:
                esc = lambda x: x.replace("|", "\\|")
                md.append(f"| {fmt(t)} | {cat} | {esc(prev)} | **{esc(text)}** | {esc(nxt)} |  |  |  |")
        md.append("")
    result = "\n".join(md)
    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"已写入 {args.output}")
    else:
        sys.stdout.write(result)


if __name__ == "__main__":
    main()
