import AboutPage from "./AboutPage.vue"
import ConceptPage from "./ConceptPage.vue"
import ContactPage from "./ContactPage.vue"
import ContributingPage from "./ContributingPage.vue"
import DownloadPage from "./DownloadPage.vue"
import EditPage from "./EditPage.vue"
import ErrorPage from "./ErrorPage.vue"
import HomePage from "./HomePage.vue"
import ItemPage from "./ItemPage.vue"
import MissingSearchPage from "./MissingSearchPage.vue"
import RegistriesPage from "./RegistriesPage.vue"
import SoftwarePage from "./SoftwarePage.vue"
import SparqlPage from "./SparqlPage.vue"
import StatsPage from "./StatsPage.vue"
import TopRatedPointsPage from "./TopRatedPointsPage.vue"
import notFoundPage from "./NotFoundPage.vue"

export const pages = {
  about: AboutPage,
  concept: ConceptPage,
  contact: ContactPage,
  contributing: ContributingPage,
  download: DownloadPage,
  edit: EditPage,
  error: ErrorPage,
  home: HomePage,
  missingSearch: MissingSearchPage,
  registries: RegistriesPage,
  registry: ItemPage,
  software: SoftwarePage,
  stats: StatsPage,
  terminology: ItemPage,
  topRatedPoints: TopRatedPointsPage,
  notFound: notFoundPage,
  sparql: SparqlPage,
}
