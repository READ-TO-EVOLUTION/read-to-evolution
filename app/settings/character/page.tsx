// app/settings/character/page.tsx
"use client"

import React, { useEffect, useState } from "react"

const STORAGE_KEY = "kurokoAnimationEnabled"

function readEnabled(): boolean {
  if (typeof window === "undefined") return true
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v == null) return true
    return v === "true"
  } catch {
    return true
  }
}

function writeEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // 失敗してもUIは落とさない
  }
}

export default function CharacterSettingsPage() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(readEnabled())
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    writeEnabled(next)
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>キャラクター設定</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>アニメーション</div>
          <div style={{ fontSize: 14, opacity: 0.75, marginTop: 4 }}>
            ONにすると、strong感情のときに身体だけLottieで動きます（顔は仕様どおり固定）。
          </div>
        </div>

        <button
          onClick={toggle}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
          aria-pressed={enabled}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </div>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        ※OFFにすると、Lottieファイルがあっても読み込まず、SVG表示になります（省電力・軽量）。
      </div>
    </div>
  )
}
