<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { contact } from '@/data/portfolio'
import { useSocialLinks } from '@/composables/useSocialLinks'
import githubLogo from '@/assets/brands/github.svg'
import linkedinLogo from '@/assets/brands/linkedin.svg'
import whatsappLogo from '@/assets/brands/whatsapp.svg'
import mailLogo from '@/assets/brands/mail.svg'

const { t } = useI18n()

const logoByKey: Record<string, string> = {
  github: githubLogo,
  linkedin: linkedinLogo,
  whatsapp: whatsappLogo,
}

const { socialExternalLinks } = useSocialLinks()

const externalLinks = socialExternalLinks
</script>

<template>
  <div
    class="grid flex-1 grid-cols-1 justify-items-center gap-4 xs:grid-cols-2 md:grid-cols-4 md:justify-items-normal"
  >
    <div v-effect="'skew'" v-for="link in externalLinks" :key="link.key">
      <k-card
        v-effect="{ type: 'spotlight', size: 77 }"
        :href="link.href"
        :aria-label="t(link.ariaKey)"
        as="a"
        class="flex size-min transform-gpu items-center justify-center p-16 text-white backdrop-blur-sm xs:p-10 md:size-full md:p-4"
        target="_blank"
        rel="noopener"
        variant="transparent"
        compact
      >
        <k-image
          :src="logoByKey[link.key]"
          :alt="link.label"
          fit="contain"
          hover="none"
          class="h-16 w-16 sm:h-20 sm:w-20 dark:invert"
          lazy
        />
      </k-card>
    </div>
    <div v-effect="'skew'">
      <k-card
        v-effect="{ type: 'spotlight', size: 77 }"
        :href="'mailto:' + contact.email"
        :aria-label="t('social.ariaEmail')"
        as="a"
        class="flex size-min transform-gpu items-center justify-center p-16 text-white backdrop-blur-sm xs:p-10 md:size-full md:p-4"
        target="_blank"
        rel="noopener"
        variant="transparent"
        compact
      >
        <k-image
          :src="mailLogo"
          alt="Email"
          fit="contain"
          hover="none"
          class="h-16 w-16 sm:h-20 sm:w-20 dark:invert"
          lazy
        />
      </k-card>
    </div>
  </div>
</template>
