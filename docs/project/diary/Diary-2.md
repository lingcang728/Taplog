> [!TIP]
> Diary 2 草稿。格式照 `Group 17 - Project Diary 1.docx`。
> - 方括号 `[ ]` 里的内容要换成真实信息：开会的时间和地点，以及 Diary 1 那 5 项任务各自的结果。
> - 内容按本组 11/23 的实际进度写，组会上说了别的就补上。
> - 定稿后复制进 Diary 1 那个 Word 文件的副本，存为 `Group 17 - Project Diary 2.docx`，然后删掉这段提示。

# Project Diary (Meeting Protocol)

**Diary Number:** 2

**Name of your project:** Traceable Visual Notes for Long Talks

**Participants in the meeting:**
- Huang Yitao (黄奕滔) — team leader / Product Owner
- Li Anyi (李安逸) — Scrum Master
- Huang Yixiang (黄奕翔)
- Li Qikai (李祈恺)
- Lin Weicheng (林韦丞)

**Time:** [2026-11-__, __:__–__:__]　　**Location:** [Dormitory / WeChat group]

## Follow-up from last meeting

1. **Topic.** In Diary 1 we had three open directions. After the early research we chose a different problem: [one sentence on why the three earlier directions were dropped]. The new topic is AI-generated notes for long recorded talks that let readers trace each point back to *all* the places in the recording that support, qualify or correct it, not only to one timestamp.
2. **Research tasks from Diary 1.** [One line per member on the result: existing products checked, classmates asked, papers found, feasibility of prototype tools, access to test users.]
3. **Proposal.** We reviewed the proposal together and submitted it on Canvas.
4. **Presentation order.** We drew number 9 in the presentation lottery.

## Discussed problems now

1. **Project plan.** We agreed on a master plan with six stages: talk materials → understanding users → design alternatives → prototype → evaluation → report and presentation. The plan, the task list and the report draft are in our shared GitHub repository, so every member works from the same files.
2. **Language.** The report, the prototype and the notes are in English. The talks we test with are Chinese, so that our Chinese-speaking participants are not held back by listening comprehension. The presentation will be in Chinese.
3. **Talk materials (finished).** We collected 13 public talks with timed subtitles and checked them for "late caveats", where a speaker qualifies or corrects a claim five or more minutes after making it.
   - Two talks have clear late caveats and become our main test material. In the TiDB talk, a claim at 01:14 is qualified by four obstacles about 27–29 minutes later. In the eBPF talk, a claim at 02:08 is qualified at 11.9, 14.4, 23.3 and 29.0 minutes later.
   - One talk (LLVM backend) has no late caveats and serves as the control.
   - The other 10 talks were checked as a sample: only one borderline case (about 6 minutes).
4. **What this means for the report.** Late caveats are not common in every talk. They appear mainly in experience-sharing talks that first recommend a solution and only near the end mention its limits. We will report this honestly in the Background chapter instead of claiming the problem is everywhere. Our argument is that a reader who jumps to a single timestamp has no reason to expect a caveat 25 minutes later.
5. **Test design.** For each main talk we wrote three tasks: a trap question answered first from the notes alone and then with audio, a find-the-quote task, and a "when does this not apply" task. We also wrote two control questions for the LLVM talk. All tasks have answer keys tied to exact timestamps. Version 1 of the prototype links each note to one timestamp. Version 2 shows every related segment with a relation label (Source, Restated, Condition, Correction, Explanation, Example).
6. **Simplified research.** We have limited time and few test users. So we will analyse online reviews instead of running a questionnaire, interview 3–5 people online, and use a cognitive walkthrough of existing products instead of field observation. The final user test must be done with real people.

## Tasks until next meeting

1. **Lin Weicheng:** try Feishu Minutes, Tongyi Tingwu and DingTalk AI notes with the TiDB talk, take screenshots, and build a comparison table — by 11/30.
2. **Li Qikai:** collect 50–100 online reviews of AI note tools, group them into 5–8 categories and count them — by 12/1.
3. **Huang Yitao:** write 3–4 interview questions and interview 3–5 people online; each member runs at least one interview — by 12/1.
4. **Li Qikai, Huang Yixiang:** cognitive walkthrough of one or two existing products, answering the four questions at each step — by 12/1.
5. **Li Anyi:** keep the task list up to date and write the next diary.

## Next meeting scheduled

**Time:** 2026-12-02 [__:__]　　**Place:** [WeChat group (online)]

At this meeting we decide whether the evidence (product comparison, online reviews, interviews) is strong enough to continue with this problem.
