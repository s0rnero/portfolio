import softiiLogo from '@/assets/brands/softii-white-DuLy8ruX.svg'
import brillaLogo from '@/assets/brands/red-brilla-logo-JBY3JAAS.svg'
import arqbsLogo from '@/assets/brands/arqbs-logo-color.webp'
import khatarsisLogo from '@/assets/brands/logo_khatarsis.svg'

export interface Contact {
  location: string
  phone: string
  email: string
  linkedinUrl: string
  githubUrl: string
  whatsappNumber: string
}

export interface SkillGroup {
  area: 'frontend' | 'backend' | 'databases' | 'cloud' | 'tools'
  skills: string[]
}

export interface Experience {
  company: string
  remote?: boolean
  period: string
  stack: string[]
}

export interface Project {
  name: string
  tech: string[]
  url: string
  image: string
  lightInkLogo?: boolean
  descriptionKey: 'softii' | 'brilla' | 'businessSuite' | 'khatarsis' | 'alytos'
}

export interface Interest {
  key: 'motorbike' | 'music' | 'games'
  icon: string
  url?: string
}

export type PetKey = 'rocco' | 'rugal'

export interface Pet {
  key: PetKey
  photoAltKey: 'about.pets.roccoAlt' | 'about.pets.rugalAlt'
  /** Deferred on purpose: the beast photos are not part of the entry graph (ADR-011). */
  loadPhoto: () => Promise<{ default: string }>
}

export interface Education {
  title: string
  institution: string
  period: string
}

export interface Language {
  name: string
  level: string
}

export interface Profile {
  name: string
  firstName: string
  lastName: string
  age: number
}

export const profile: Profile = {
  name: 'César Andrés Ríos Valencia',
  firstName: 'César',
  lastName: 'Ríos',
  age: 23,
}

export const contact: Contact = {
  location: 'Cali, Colombia',
  phone: '+57 305 450 1829',
  email: 'cesarandresriosvalen@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/dev-carv/',
  githubUrl: 'https://github.com/s0rnero',
  whatsappNumber: '573054501829',
}

export const buildWhatsappUrl = (message: string): string =>
  `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`

export interface SocialLink {
  key: 'github' | 'linkedin' | 'whatsapp' | 'email'
  href: string
  icon: string
  label: string
  ariaKey: string
}

export const socialLinks: SocialLink[] = [
  {
    key: 'github',
    href: contact.githubUrl,
    icon: 'mdi:github',
    label: 'GitHub',
    ariaKey: 'social.ariaGitHub',
  },
  {
    key: 'linkedin',
    href: contact.linkedinUrl,
    icon: 'mdi:linkedin',
    label: 'LinkedIn',
    ariaKey: 'social.ariaLinkedIn',
  },
  {
    key: 'whatsapp',
    href: `https://wa.me/${contact.whatsappNumber}`,
    icon: 'mdi:whatsapp',
    label: 'WhatsApp',
    ariaKey: 'social.ariaWhatsApp',
  },
  {
    key: 'email',
    href: `mailto:${contact.email}`,
    icon: 'mdi:email',
    label: 'Email',
    ariaKey: 'social.ariaEmail',
  },
]

export const skills: SkillGroup[] = [
  {
    area: 'frontend',
    skills: [
      'Vue.js',
      'Angular',
      'React',
      'TypeScript',
      'Quasar',
      'Tailwind CSS',
      'Vite',
      'Microfrontends',
    ],
  },
  {
    area: 'backend',
    skills: [
      'Java',
      'Spring Boot',
      'Spring WebFlux',
      'Node.js',
      'NestJS',
      'REST API',
      'Microservices',
    ],
  },
  {
    area: 'databases',
    skills: ['PL/SQL', 'SQL Server', 'MySQL', 'MongoDB', 'PostgreSQL'],
  },
  {
    area: 'cloud',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'Azure', 'AWS', 'OCI', 'Linux'],
  },
  {
    area: 'tools',
    skills: ['Git', 'IA'],
  },
]

export const experiences: Experience[] = [
  {
    company: 'ArquitecSOFT',
    period: 'Ene 2022 - Feb 2024',
    stack: ['Vue 3', 'Spring Boot', 'Kubernetes', 'PL/SQL', 'Oracle', 'OCI'],
  },
  {
    company: 'Softii',
    remote: true,
    period: 'Feb 2024 - Abr 2025',
    stack: ['Vue', 'Quasar', 'Node.js/NestJS', 'MongoDB', 'AWS'],
  },
  {
    company: 'AD Soluciones',
    period: 'May 2025 - Feb 2026',
    stack: ['Angular', 'Spring WebFlux', 'SQL Server', 'Azure', 'Kubernetes'],
  },
]

export const projects: Project[] = [
  {
    name: 'Business Suite',
    descriptionKey: 'businessSuite',
    tech: ['Vue 3', 'Spring Boot', 'Kubernetes', 'PL/SQL', 'Oracle', 'OCI'],
    url: 'https://ms-prd.saas.arqbs.com/login',
    image: arqbsLogo,
  },
  {
    name: 'Softii',
    descriptionKey: 'softii',
    tech: ['Vue', 'Quasar', 'Node.js/NestJS', 'MongoDB', 'AWS'],
    url: 'https://softii.business/login',
    image: softiiLogo,
    lightInkLogo: true,
  },
  {
    name: 'Brilla',
    descriptionKey: 'brilla',
    tech: ['Angular', 'Spring WebFlux', 'SQL Server', 'Azure', 'Kubernetes'],
    url: 'https://portal2.brilla.com.co/#/login/ally',
    image: brillaLogo,
  },
  {
    name: 'Khatarsis',
    descriptionKey: 'khatarsis',
    tech: ['Vue 3', 'TypeScript', 'Tailwind CSS'],
    url: 'https://github.com/s0rnero/khatarsis',
    image: khatarsisLogo,
  },
  {
    name: 'Alytos',
    descriptionKey: 'alytos',
    tech: ['Java', 'Spring Boot', 'WebFlux', 'R2DBC', 'Gradle'],
    url: 'https://github.com/s0rnero/alytos',
    image: '',
  },
]

export const interests: Interest[] = [
  { key: 'motorbike', icon: 'mdi:motorbike' },
  { key: 'music', icon: 'mdi:music' },
  { key: 'games', icon: 'mdi:gamepad-variant' },
]

// Rocco and Rugal are proper nouns (same in both locales), so the names live in
// the template and the visible labels they carry live in the locale files.
export const pets: Pet[] = [
  {
    key: 'rocco',
    photoAltKey: 'about.pets.roccoAlt',
    loadPhoto: () => import('@/assets/beasts/rocco.webp'),
  },
  {
    key: 'rugal',
    photoAltKey: 'about.pets.rugalAlt',
    loadPhoto: () => import('@/assets/beasts/rugal.webp'),
  },
]

export const education: Education = {
  title: 'Técnico en Programación de Software',
  institution: 'SENA - CEAI, Cali',
  period: 'Ene 2021 - Ene 2022',
}

export const languages: Language[] = [
  { name: 'Español', level: 'Nativo' },
  { name: 'Inglés', level: 'Intermedio (B1)' },
]
