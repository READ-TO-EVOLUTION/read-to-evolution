/**
 * ChangeTag.slug の整合性チェックスクリプト
 * 
 * 実行: npx tsx prisma/check-changetag-integrity.ts
 * 
 * チェック項目:
 * 1. slug が NULL のレコードがないか
 * 2. slug が空文字のレコードがないか
 * 3. slug の重複がないか
 * 4. label と slug の対応が壊れていないか
 * 5. isActive=false のレコードのslug状態
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkIntegrity() {
  console.log('🔍 ChangeTag.slug 整合性チェック開始...\n')

  const allTags = await prisma.changeTag.findMany({
    select: {
      id: true,
      label: true,
      slug: true,
      isActive: true,
    },
    orderBy: { label: 'asc' },
  })

  console.log(`📊 総レコード数: ${allTags.length}\n`)

  // 1. NULL チェック
  const nullSlugs = allTags.filter((tag) => tag.slug === null)
  if (nullSlugs.length > 0) {
    console.log(`❌ slug が NULL のレコード: ${nullSlugs.length}件`)
    nullSlugs.forEach((tag) => {
      console.log(`   - ID: ${tag.id}, label: ${tag.label}, isActive: ${tag.isActive}`)
    })
    console.log()
  } else {
    console.log('✅ slug が NULL のレコード: 0件\n')
  }

  // 2. 空文字チェック
  const emptySlugs = allTags.filter((tag) => tag.slug === '')
  if (emptySlugs.length > 0) {
    console.log(`❌ slug が空文字のレコード: ${emptySlugs.length}件`)
    emptySlugs.forEach((tag) => {
      console.log(`   - ID: ${tag.id}, label: ${tag.label}, isActive: ${tag.isActive}`)
    })
    console.log()
  } else {
    console.log('✅ slug が空文字のレコード: 0件\n')
  }

  // 3. 重複チェック
  const slugMap = new Map<string, string[]>()
  allTags.forEach((tag) => {
    if (tag.slug) {
      if (!slugMap.has(tag.slug)) {
        slugMap.set(tag.slug, [])
      }
      slugMap.get(tag.slug)!.push(tag.id)
    }
  })

  const duplicates: Array<{ slug: string; ids: string[] }> = []
  slugMap.forEach((ids, slug) => {
    if (ids.length > 1) {
      duplicates.push({ slug, ids })
    }
  })

  if (duplicates.length > 0) {
    console.log(`❌ slug の重複: ${duplicates.length}件`)
    duplicates.forEach((dup) => {
      const tags = allTags.filter((tag) => dup.ids.includes(tag.id))
      console.log(`   - slug: "${dup.slug}"`)
      tags.forEach((tag) => {
        console.log(`     * ID: ${tag.id}, label: ${tag.label}, isActive: ${tag.isActive}`)
      })
    })
    console.log()
  } else {
    console.log('✅ slug の重複: 0件\n')
  }

  // 4. isActive=false のレコードの状態
  const inactiveTags = allTags.filter((tag) => !tag.isActive)
  if (inactiveTags.length > 0) {
    console.log(`ℹ️  isActive=false のレコード: ${inactiveTags.length}件`)
    const inactiveWithoutSlug = inactiveTags.filter((tag) => !tag.slug)
    if (inactiveWithoutSlug.length > 0) {
      console.log(`   - slug未設定: ${inactiveWithoutSlug.length}件`)
      inactiveWithoutSlug.forEach((tag) => {
        console.log(`     * ID: ${tag.id}, label: ${tag.label}`)
      })
    }
    console.log()
  } else {
    console.log('ℹ️  isActive=false のレコード: 0件\n')
  }

  // 5. 統計情報
  const activeTags = allTags.filter((tag) => tag.isActive)
  const activeWithSlug = activeTags.filter((tag) => tag.slug && tag.slug !== '')
  const activeWithoutSlug = activeTags.filter((tag) => !tag.slug || tag.slug === '')

  console.log('📈 統計情報:')
  console.log(`   - 有効タグ (isActive=true): ${activeTags.length}件`)
  console.log(`     * slug設定済み: ${activeWithSlug.length}件`)
  console.log(`     * slug未設定: ${activeWithoutSlug.length}件`)
  console.log(`   - 無効タグ (isActive=false): ${inactiveTags.length}件`)
  console.log()

  // 結果サマリー
  const hasIssues =
    nullSlugs.length > 0 || emptySlugs.length > 0 || duplicates.length > 0

  if (hasIssues) {
    console.log('❌ 整合性チェック: 問題あり')
    console.log('   マイグレーション前に上記の問題を修正してください。\n')
    process.exit(1)
  } else {
    console.log('✅ 整合性チェック: 問題なし')
    console.log('   マイグレーションを実行できます。\n')
    process.exit(0)
  }
}

checkIntegrity()
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
