import { wasSpyNav } from '@/composables/useSectionSpy'
import { scrollTo } from '@/composables/useSmoothScroll'
import MainView from '@/views/MainView.vue'
import { createRouter, createWebHistory } from 'vue-router'

export type RouteName = 'main' | 'projects' | 'contact'

export const NAV_SECTIONS = [
  {
    name: 'projects' as const,
    hash: '#projects' as const,
    sectionId: 'projects' as const,
    labelKey: 'nav.projects' as const,
    icon: 'akar-icons:briefcase' as const,
  },
  {
    name: 'about' as const,
    hash: '#about' as const,
    sectionId: 'about' as const,
    labelKey: 'nav.about' as const,
    icon: 'akar-icons:info' as const,
  },
  {
    name: 'contact' as const,
    hash: '#contact' as const,
    sectionId: 'contact' as const,
    labelKey: 'nav.contact' as const,
    icon: 'akar-icons:phone' as const,
  },
] as const

const routesMap = {
  main: { path: '/', name: 'main' as RouteName, section: null },
  projects: { path: '/projects', name: 'projects' as RouteName, section: 'projects' },
  contact: { path: '/contact', name: 'contact' as RouteName, section: 'contact' },
} as const

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (wasSpyNav()) return false
    if (to.hash) {
      setTimeout(() => scrollTo(to.hash), 80)
      return false
    }
    const section = to.meta.section as string | null
    if (section) {
      scrollTo(`#${section}`)
      return false
    }
    const byPath = NAV_SECTIONS.find(s => `/${s.name}` === to.path)
    if (byPath) {
      setTimeout(() => scrollTo(byPath.hash), 80)
      return false
    }
    return false
  },
  routes: [
    {
      path: routesMap.main.path,
      name: routesMap.main.name,
      component: MainView,
    },
    ...(['projects', 'contact'] as const).map(name => ({
      path: routesMap[name].path,
      name: routesMap[name].name,
      component: MainView,
      meta: { section: routesMap[name].section },
    })),
    {
      path: '/vicecity',
      // Legacy deep-link: the game is a state-driven overlay now (the URL never
      // changes), so the old address lands back home instead of mounting a view.
      redirect: routesMap.main.path,
    },
  ],
})

export { routesMap }
export default router
