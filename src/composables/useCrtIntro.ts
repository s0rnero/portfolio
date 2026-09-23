import { ref } from 'vue'

const isCrtDone = ref(false)

export function markCrtDone(): void {
  isCrtDone.value = true
}

export { isCrtDone }
