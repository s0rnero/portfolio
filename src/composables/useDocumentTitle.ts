import { computed, onScopeDispose, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { NAV_SECTIONS } from '@/router'
import { isExperienceVisible } from './useVCGame'

const TITLE_SEPARATOR = '★'

export function useDocumentTitle() {
  const { t } = useI18n()
  const route = useRoute()

  const sectionLabelKey = computed(() => {
    if (isExperienceVisible.value) return null
    const section = route.meta.section as string | null
    if (section) {
      return NAV_SECTIONS.find(entry => entry.name === section)?.labelKey ?? null
    }
    if (route.hash) {
      return NAV_SECTIONS.find(entry => entry.hash === route.hash)?.labelKey ?? null
    }
    return null
  })

  const title = computed(() => {
    if (isExperienceVisible.value) return t('game.title')
    const labelKey = sectionLabelKey.value
    return labelKey ? `${t('meta.siteName')} ${TITLE_SEPARATOR} ${t(labelKey)}` : t('meta.siteName')
  })

  const enforceTitle = (value: string) => {
    if (document.title !== value) document.title = value
  }

  let engineTitleWatcher: MutationObserver | null = null

  const stopEngineTitleWatch = () => {
    engineTitleWatcher?.disconnect()
    engineTitleWatcher = null
  }

  watch(
    title,
    value => {
      enforceTitle(value)
    },
    { immediate: true },
  )

  watch(
    isExperienceVisible,
    visible => {
      stopEngineTitleWatch()
      enforceTitle(title.value)
      if (!visible) return
      engineTitleWatcher = new MutationObserver(() => enforceTitle(title.value))
      engineTitleWatcher.observe(document.head, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    },
    { immediate: true },
  )

  onScopeDispose(stopEngineTitleWatch)

  return { title }
}
