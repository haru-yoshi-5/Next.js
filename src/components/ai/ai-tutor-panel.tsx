"use client"

import {
  ArrowRightIcon,
  CircleAlertIcon,
  InfoIcon,
  LoaderIcon,
  MessageCircleQuestionIcon,
  SendIcon,
} from "lucide-react"
import Link from "next/link"
import {
  type FormEvent,
  type KeyboardEvent,
  useId,
  useRef,
  useState,
} from "react"

import { AiErrorNotice } from "@/components/ai/ai-error-notice"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  countCharacters,
  formatAnswer,
  QUESTION_MAX_LENGTH,
  requestExplanation,
  type TutorResult,
  validateQuestion,
} from "@/lib/ai/client"
import { cn } from "@/lib/utils"

interface AiTutorPanelProps {
  lessonId: string
  lessonTitle: string
}

type PanelState =
  | { status: "idle" }
  | { status: "loading"; question: string }
  | { status: "done"; question: string; result: TutorResult }

/** 入力欄を埋めるだけの例（押しても送信はしない） */
const EXAMPLE_QUESTIONS = [
  "ここでなぜサーバー処理を使うのですか？",
  "この教材のポイントを短くまとめてください",
  "初心者がつまずきやすいところはどこですか？",
]

/**
 * 教材ごとの「AI に質問する」パネル（AI Context Tutor）。
 * API を呼ぶのは、利用者が質問を送信したときだけ。表示・スクロール・デモの操作では呼ばない。
 * 状態は Sheet の外に持ち、パネルを閉じても回答や送信中の処理を失わないようにする。
 */
export function AiTutorPanel({ lessonId, lessonTitle }: AiTutorPanelProps) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const [state, setState] = useState<PanelState>({ status: "idle" })
  /** 連続クリックによる重複送信を防ぐ（state の更新を待たずに判定する） */
  const inFlight = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const id = useId()
  const textareaId = `${id}-question`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const privacyId = `${id}-privacy`

  const isLoading = state.status === "loading"
  const length = countCharacters(question.trim())
  const tooLong = length > QUESTION_MAX_LENGTH

  async function send(text: string) {
    if (inFlight.current) return
    const problem = validateQuestion(text)
    if (problem) {
      setInputError(problem)
      textareaRef.current?.focus()
      return
    }
    const trimmed = text.trim()
    setInputError(null)
    inFlight.current = true
    setState({ status: "loading", question: trimmed })

    const result = await requestExplanation({ lessonId, question: trimmed })
    inFlight.current = false
    setState({ status: "done", question: trimmed, result })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send(question)
  }

  /** Ctrl + Enter（Mac は ⌘ + Enter）でも送信できる。Enter だけでは改行する */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey) &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      void send(question)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="lg" />}>
        <MessageCircleQuestionIcon aria-hidden />
        AI に質問する
        {isLoading ? (
          <LoaderIcon
            aria-label="回答を作成中"
            className="motion-safe:animate-spin"
          />
        ) : null}
      </SheetTrigger>
      <SheetContent
        side="right"
        initialFocus={textareaRef}
        className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="pr-12">
          <SheetTitle>AI に質問する</SheetTitle>
          <SheetDescription>
            教材「{lessonTitle}」の内容に沿って、AI が解説します。
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-2"
          >
            <label htmlFor={textareaId} className="text-sm font-medium">
              質問
            </label>
            <textarea
              ref={textareaRef}
              id={textareaId}
              name="question"
              rows={4}
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value)
                if (inputError) setInputError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="例: ここでなぜサーバー処理を使うのですか？"
              autoComplete="off"
              aria-invalid={inputError !== null || tooLong}
              aria-describedby={`${hintId} ${errorId} ${privacyId}`}
              className={cn(
                "min-h-24 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
                (inputError !== null || tooLong) && "border-destructive",
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <p id={hintId} className="text-xs text-muted-foreground">
                Ctrl + Enter（Mac は ⌘ + Enter）でも送信できます。
              </p>
              <p
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  tooLong ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {length} / {QUESTION_MAX_LENGTH}
                <span className="sr-only">文字</span>
              </p>
            </div>
            <p
              id={errorId}
              role="alert"
              className="flex min-h-5 items-center gap-1.5 text-sm text-destructive empty:min-h-0"
            >
              {inputError ? (
                <>
                  <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
                  {inputError}
                </>
              ) : null}
            </p>

            {question.trim() === "" && state.status === "idle" ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">
                  質問の例（押すと入力欄に入ります）
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {EXAMPLE_QUESTIONS.map((example) => (
                    <li key={example}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        className="h-auto py-1 text-left whitespace-normal"
                        onClick={() => {
                          setQuestion(example)
                          setInputError(null)
                          textareaRef.current?.focus()
                        }}
                      >
                        {example}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="self-end"
            >
              {isLoading ? (
                <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
              ) : (
                <SendIcon aria-hidden />
              )}
              {isLoading ? "送信中…" : "送信する"}
            </Button>
          </form>

          <section
            aria-label="AI の回答"
            aria-live="polite"
            aria-busy={isLoading}
            className="flex flex-col gap-3"
          >
            <TutorResultView
              state={state}
              onRetry={(text) => void send(text)}
              onNavigate={() => setOpen(false)}
            />
          </section>

          <div
            id={privacyId}
            className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"
          >
            <p className="font-medium text-foreground">送信する内容と注意</p>
            <ul className="flex list-disc flex-col gap-1 pl-4">
              <li>
                送るのは、この教材の ID（
                <code className="font-mono">{lessonId}</code>
                ）と、入力した質問だけです。教材の本文はサーバーが ID
                から読み込みます。
              </li>
              <li>
                質問は Google の Gemini API で処理されます。無料枠のため、入力は
                Google
                の製品改善に使われ、人が読むことがあります。個人情報や秘密情報は入力しないでください。
              </li>
              <li>18 歳以上の方が、日本国内から使う場合に限ります。</li>
              <li>
                利用回数を数えるため、匿名の Cookie（24 時間有効）を保存し、IP
                アドレスから作った値をサーバーで当日中だけ使います。
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TutorResultView({
  state,
  onRetry,
  onNavigate,
}: {
  state: PanelState
  onRetry: (question: string) => void
  onNavigate: () => void
}) {
  if (state.status === "idle") {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        まだ質問していません。教材を読んで気になったことを、上の欄に入力してください。
      </p>
    )
  }

  const askedQuestion = (
    <p className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">質問:</span>{" "}
      {state.question}
    </p>
  )

  if (state.status === "loading") {
    return (
      <>
        {askedQuestion}
        <p className="flex items-center gap-2 rounded-lg border px-4 py-6 text-sm text-muted-foreground">
          <LoaderIcon
            aria-hidden
            className="size-4 shrink-0 motion-safe:animate-spin"
          />
          回答を作成しています。30 秒ほどかかることがあります。
        </p>
      </>
    )
  }

  const { result } = state

  if (result.status === "error") {
    return (
      <>
        {askedQuestion}
        <AiErrorNotice
          message={result.message}
          onRetry={result.retryable ? () => onRetry(state.question) : undefined}
        />
      </>
    )
  }

  return (
    <>
      {askedQuestion}
      <div className="flex flex-col gap-3 rounded-lg border px-4 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {formatAnswer(result.answer)}
        </p>
        <p className="flex gap-1.5 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {result.notice}
            {result.cached
              ? "（同じ質問への、以前の回答を表示しています）"
              : null}
          </span>
        </p>
      </div>
      {result.references.length > 0 ? (
        <nav aria-label="関連する教材" className="flex flex-col gap-1.5">
          <p className="text-xs font-medium">関連する教材</p>
          <ul className="flex flex-col gap-1">
            {result.references.map((reference) => (
              <li key={reference.slug}>
                <Link
                  href={reference.href}
                  onClick={onNavigate}
                  className="inline-flex items-center gap-1 rounded-sm text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {reference.title}
                  <ArrowRightIcon aria-hidden className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  )
}
