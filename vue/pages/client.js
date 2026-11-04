import { pageFiles } from "./pageFiles.js"

const modules = import.meta.glob("./*Page.vue")

export async function loadClientPage(name) {
  const load = modules[`./${pageFiles[name]}`]
  if (!load) {
    throw new Error(`Unknown Vue page: ${name}`)
  }
  return (await load()).default
}
