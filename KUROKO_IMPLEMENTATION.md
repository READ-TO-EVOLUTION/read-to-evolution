# 黒子キャラクター実装完了

## 実装ファイル一覧

### コアライブラリ（`app/lib/emotion/`）
- ✅ `types.ts` - 感情・イベント型定義
- ✅ `rules.ts` - イベント→感情の変換ルール
- ✅ `engine.ts` - 優先度合成・時間減衰エンジン
- ✅ `emotionView.ts` - 顔パーツ解決
- ✅ `strongBodyLottieMap.ts` - Lottieパス解決
- ✅ `index.ts` - エクスポート集約

### UIコンポーネント
- ✅ `app/components/character/KurokoLottieCharacter.tsx` - メインキャラクターコンポーネント
- ✅ `app/settings/character/page.tsx` - アニメーションON/OFF設定画面

### 依存ライブラリ
- ✅ `lottie-react` - インストール済み

### フォルダ
- ✅ `public/lottie/kuroko/` - Lottieファイル配置用フォルダ作成済み

## 使用方法

### 基本的な使用例

```tsx
import KurokoLottieCharacter from "@/app/components/character/KurokoLottieCharacter"
import type { EmotionState } from "@/app/lib/emotion"

function MyPage() {
  const [emotion, setEmotion] = useState<EmotionState>({
    emotion: "relief",
    intensity: "weak"
  })

  return (
    <KurokoLottieCharacter
      state={emotion}
      size={220}
    />
  )
}
```

### イベント駆動の使用例

```tsx
import { computeNextEmotionFromEvents, DEFAULT_TIMING } from "@/app/lib/emotion"
import type { AppEvent, EmotionState, TimedEmotion } from "@/app/lib/emotion"

function useEmotionEngine() {
  const [current, setCurrent] = useState<EmotionState>({
    emotion: "relief",
    intensity: "weak"
  })
  const [timed, setTimed] = useState<TimedEmotion | null>(null)
  const [lastApplied, setLastApplied] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const events: AppEvent[] = [] // イベントを収集

      const result = computeNextEmotionFromEvents({
        events,
        current,
        nowMs: now,
        timed,
        lastAppliedAtMs: lastApplied,
        cfg: DEFAULT_TIMING,
      })

      setCurrent(result.nextState)
      setTimed(result.nextTimed)
      if (result.appliedAtMs !== null) {
        setLastApplied(result.appliedAtMs)
      }
    }, 100) // 100msごとに更新

    return () => clearInterval(interval)
  }, [current, timed, lastApplied])

  return current
}
```

## 設定画面

`/settings/character` にアクセスして、アニメーションのON/OFFを切り替えられます。

- **ON**: strong感情のときにLottieアニメーションが再生される
- **OFF**: 常にSVG表示（Lottieファイルを読み込まない）

設定は`localStorage`の`kurokoAnimationEnabled`キーに保存されます。

## Lottieファイルの配置

以下のファイルを`public/lottie/kuroko/`に配置してください：

- `body_strong_joy.json`
- `body_strong_anger.json`
- `body_strong_sadness.json`
- `body_strong_fun.json`
- `body_strong_shy.json`
- `body_strong_fear.json`
- `body_strong_surprise.json`
- `body_strong_relief.json`
- `body_strong_confused.json`

**注意**: Lottieファイルが存在しない場合でも、SVGフォールバックで表示されます。

## 感情一覧

### 9種類の感情
1. **joy** (喜) - 笑顔
2. **anger** (怒) - 怒り
3. **sadness** (哀) - 悲しみ
4. **fun** (楽) - 楽しさ
5. **shy** (照れ) - 照れ（頬に赤点）
6. **fear** (恐) - 恐れ
7. **surprise** (驚) - 驚き
8. **relief** (安心) - 安心
9. **confused** (迷い) - 混乱

### 強弱（2段階）
- **weak**: 顔のみ変化
- **strong**: 顔＋身体変化（Lottie）

## 動作確認手順

1. **設定画面確認**
   ```
   http://localhost:3000/settings/character
   ```
   - ON/OFFが切り替わること
   - リロードしても状態が保持されること

2. **キャラクター表示確認**
   - どこかのページで`KurokoLottieCharacter`を表示
   - 各感情のstateを変えて確認
   - 照れ（shy）だけ頬赤点が出ること
   - strongの時だけ（かつ設定ONの時だけ）Lottieが動くこと
   - Lottieが存在しない場合でもSVGで表示が継続すること

## 次のステップ

ホーム画面（`app/page.tsx`）などに`KurokoLottieCharacter`を統合し、実際のイベント（学習開始、成功、エラーなど）に応じて感情を更新する実装を行ってください。
