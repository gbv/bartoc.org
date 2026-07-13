import EditPage from "./EditPage.vue"
import ErrorPage from "./ErrorPage.vue"
import MissingSearchPage from "./MissingSearchPage.vue"
import RegistriesPage from "./RegistriesPage.vue"
import StatsPage from "./StatsPage.vue"
import notFoundPage from "./NotFoundPage.vue"

export const pages = {
  edit: EditPage,
  error: ErrorPage,
  missingSearch: MissingSearchPage,
  registries: RegistriesPage,
  stats: StatsPage,
  notFound: notFoundPage,
}
