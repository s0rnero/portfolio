import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildWhatsappUrl, socialLinks } from '@/data/portfolio'

export const useSocialLinks = () => {
  const { t } = useI18n()

  const socialExternalLinks = computed(() =>
    socialLinks
      .filter(link => link.key !== 'email')
      .map(link =>
        link.key === 'whatsapp'
          ? { ...link, href: buildWhatsappUrl(t('social.whatsappMessage')) }
          : link,
      ),
  )

  return { socialExternalLinks }
}
