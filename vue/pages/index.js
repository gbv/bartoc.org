import ConceptPage from "./ConceptPage.vue"
import EditPage from "./EditPage.vue"
import ErrorPage from "./ErrorPage.vue"
import MissingSearchPage from "./MissingSearchPage.vue"
import RegistriesPage from "./RegistriesPage.vue"
import SparqlPage from "./SparqlPage.vue"
import StatsPage from "./StatsPage.vue"
import TerminologyPage from "./TerminologyPage.vue"
import notFoundPage from "./NotFoundPage.vue"

export const pages = {
  concept: ConceptPage,
  edit: EditPage,
  error: ErrorPage,
  missingSearch: MissingSearchPage,
  registries: RegistriesPage,
  stats: StatsPage,
  terminology: TerminologyPage,
  notFound: notFoundPage,
  sparql: SparqlPage,
}
