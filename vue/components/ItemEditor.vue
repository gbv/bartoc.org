<template>
  <p style="border-top: 1px solid var(--cc-border-color)">
    Basic information about the vocabulary:
  </p>
  <form-row
    v-if="item.uri"
    :label="'URI'">
    <a :href="item.uri">{{ item.uri }}</a>
  </form-row>
  <form-row :label="'Title'">
    <label-editor
      v-model:pref-label="item.prefLabel"
      v-model:alt-label="item.altLabel" />
    The first of each language is used as preferred title, more as aliases,
    translations... Please provide at least an English title.
    For other languages select always a value,
    it could be also "undetermined" if you do not know the language.
  </form-row>
  <form-row :label="'Abbreviation'">
    <AbbreviationEditor
      ref="abbreviationEditor"
      v-model="item.notation"
      :source="versionMainSource" />
    Common, unique abbreviation, acronym, or notation the vocabulary is known
    under.
  </form-row>
  <form-row :label="'Identifier'">
    <list-editor v-model="item.identifier" />
    Alternative URIs the vocabulary is identified by (e.g. Wikidata URI).
  </form-row>
  <form-row :label="'Abstracts'">
    <InheritableAbstractsEditor
      ref="inheritableAbstractsEditor"
      v-model="item.definition"
      :source="versionMainSource"
      :require-english="requireEnglish" />
    <div
      v-if="!requireEnglish"
      class="editor-help-text">
      An English abstract is optional because this terminology is a version of another BARTOC terminology.
    </div>
  </form-row>
  <form-row :label="'Languages'">
    <language-select
      v-model="item.languages"
      class="cc-form-control"
      :repeatable="true" />
  </form-row>
  <form-row :label="'Size'">
    <input
      v-model="item.extent"
      type="text"
      class="cc-form-control">
    Number of classes, subclasses, taxa, terms, concepts etc. Please add date in
    parenthesis (YYYY-MM).
  </form-row>
  <form-row :label="'KOS Types'">
    <set-select
      :model-value="type"
      :options="kostypes"
      @update:modelValue="item.type = $event.map((t) => t.uri)" />
    Use Shift key to deselect or select multiple types.
  </form-row>
  <form-row :label="'Subjects'">
    <InheritableSubjectsEditor
      ref="inheritableSubjectsEditor"
      v-model="item.subject"
      :source="versionMainSource" />
  </form-row>
  <form-row
    v-if="showVersionOfEditor"
    :label="'Version of'">
    <terminology-relation-editor
      v-model="item.versionOf"
      :multiple="false"
      placeholder="Select another terminology from BARTOC" />
  </form-row>
  <form-row :label="'Based on'">
    <terminology-relation-editor
      v-model="item.basedOn"
      :multiple="true"
      placeholder="Select another terminology from BARTOC" />
  </form-row>
  <hr>
  <p>How the vocabulary is made available:</p>
  <form-row :label="'Created'">
    <input
      v-model="item.startDate"
      type="text"
      class="cc-form-control"
      maxlength="4">
    The year when the KOS was first created (YYYY).
  </form-row>
  <form-row :label="'License'">
    <jskos-item-picker
      v-model="item.license"
      :provider="licenseProvider"
      placeholder="Search licenses…" />
  </form-row>
  <form-row :label="'URL'">
    <input
      v-model="item.url"
      type="text"
      class="cc-form-control">
  </form-row>
  <form-row :label="'Additional links'">
    <list-editor
      :model-value="item.subjectOf.map((s) => s.url)"
      @update:modelValue="item.subjectOf = $event.map((url) => ({ url }))" />
  </form-row>
  <form-row :label="'Formats'">
    <jskos-item-picker
      v-model="item.FORMAT"
      :provider="formatProvider"
      placeholder="Search format types…" />
  </form-row>
  <form-row :label="'Access'">
    <set-select
      v-model="item.ACCESS"
      :options="access" />
    Do you have to register to view the KOS, is it 'hidden' in a licensed
    database or is it free online?
  </form-row>
  <form-row :label="'Publisher'">
    <publisher-editor v-model="item.publisher" />
    Try to use an institution rather than a person.
  </form-row>
  <form-row :label="'Address'">
    <address-editor v-model="item.ADDRESS" />
  </form-row>
  <form-row label="Contact">
    <input
      v-model="item.CONTACT"
      type="text"
      class="cc-form-control">
    email address of anyone in charge of the vocabulary
  </form-row>
  <form-row label="Listed In">
    <jskos-item-picker
      v-model="item.partOf"
      :provider="registryProvider"
      placeholder="Search registries…"
      :show-tree="false" />
    Which <a href="/registries">terminology registries</a> list the vocabulary?
  </form-row>
  <form-row :label="'Vocabulary services'">
    <endpoints-editor v-model="item.API" />
  </form-row>
  <form-row label="Display options">
    <div class="editor-display-option">
      <input
        id="hideNotation"
        v-model="item.DISPLAY.hideNotation"
        type="checkbox">
      <div>
        <label for="hideNotation">hide notation</label>
        it is only used as internal identifier
      </div>
    </div>
    <div class="editor-display-option">
      <input
        id="numericalNotation"
        v-model="item.DISPLAY.numericalNotation"
        type="checkbox">
      <div>
        <label for="numericalNotation">numerical notation</label>
        concepts of this vocabulary will be sorted numerically when displayed as
        a list
      </div>
    </div>
  </form-row>
  <hr>
  <p>Relevant only if concept notations are mapped to concept URIs:</p>
  <form-row :label="'namespace'">
    <input
      v-model="item.namespace"
      type="text"
      class="cc-form-control">
  </form-row>
  <form-row :label="'notation pattern'">
    <input
      v-model="item.notationPattern"
      type="text"
      class="cc-form-control">
  </form-row>
  <form-row :label="'URI pattern'">
    <input
      v-model="item.uriPattern"
      type="text"
      class="cc-form-control">
  </form-row>
  <form-row :label="'example notations'">
    <input
      v-model="examples"
      type="text"
      class="cc-form-control">
    Please use comma to separate multiple notations.
  </form-row>
  <hr>
  <p>
    By saving you agree to publish the vocabulary metadata as public domain. All
    metadata is editable by the community of
    <a href="/contact">the BARTOC.org editors</a>.
  </p>
  <div class="editor-actions-row">
    <div class="action-group">
      <button
        v-if="auth"
        class="cc-button cc-button-primary"
        @click="saveItem">
        save
      </button>
      <button
        v-else
        class="cc-button cc-button-danger"
        @click="saveItem">
        authentification required!
      </button>
      <button
        class="cc-button cc-button-secondary"
        onclick="location.reload()">
        reset
      </button>
    </div>
    <div class="action-group">
      <input
        id="showJSKOS"
        v-model="showJSKOS"
        type="checkbox"><label
          for="showJSKOS">show JSKOS record</label>
    </div>
  </div>
  <div
    v-if="error"
    class="editor-error-row">
    <div
      class="cc-message cc-message--warning"
      role="alert">
      <p>error {{ error.status }}: {{ error.message }}</p>
      <p
        v-if="error.html"
        v-html="error.html" />
    </div>
  </div>
  <pre v-show="showJSKOS">{{ jskosPreview }}</pre>
</template>

<script setup>
import { computed, reactive, ref, toRaw, watch } from "vue"
import {
  loadConcepts,
  trimItemIdentifiers,
  createConceptApiProvider,
  createRegistryProvider,
} from "../utils.js"
import {
  cleanupItem,
  conceptPickerModel,
  itemError as validateItem,
  normalizeEditableItem,
  parseNotationExamples,
  hasValidVersionOf,
} from "../utils/itemEditor.js"
import { saveVocabularyItem } from "../utils/itemEditorSave.js"

import FormRow from "./FormRow.vue"
import SetSelect from "./SetSelect.vue"
import LanguageSelect from "./LanguageSelect.vue"
import InheritableAbstractsEditor from "./InheritableAbstractsEditor.vue"
import InheritableSubjectsEditor from "./InheritableSubjectsEditor.vue"
import LabelEditor from "./LabelEditor.vue"
import ListEditor from "./ListEditor.vue"
import AddressEditor from "./AddressEditor.vue"
import EndpointsEditor from "./EndpointsEditor.vue"
import JskosItemPicker from "./JskosItemPicker.vue"
import PublisherEditor from "./PublisherEditor.vue"
import TerminologyRelationEditor from "./TerminologyRelationEditor.vue"
import AbbreviationEditor from "./AbbreviationEditor.vue"

const props = defineProps({
  user: {
    type: Object,
    default: () => undefined,
  },
  auth: {
    type: Object,
    default: () => undefined,
  },
  current: {
    type: Object,
    default: () => ({}),
  },
  versionMain: {
    type: Object,
    default: null,
  },
  hasIncomingVersions: {
    type: Boolean,
    default: false,
  },
})

// Edit a deep copy so normalization and form changes do not mutate props.current.
const item = reactive(normalizeEditableItem(structuredClone(toRaw(props.current))))
const examples = ref((item.notationExamples || []).join(", "))
const kostypes = ref([])
const licenses = ref([])
const formats = ref([])
const access = ref([])
const registries = ref([])
const error = ref(null)
const showJSKOS = ref(false)
const abbreviationEditor = ref(null)
const inheritableAbstractsEditor = ref(null)
const inheritableSubjectsEditor = ref(null)
const formatScheme = {
  uri: "http://bartoc.org/en/node/20000",
}

const registriesLoaded = loadConcepts("/registries?format=jskos").then((set) => {
  registries.value = Array.isArray(set) ? set : Object.values(set || {})
  return registries.value
})

const formatProvider = createConceptApiProvider({
  schemeUri: "http://bartoc.org/en/node/20000",
  topUrl: "/api/voc/top",
  conceptsUrl: "/api/concepts",
  suggestUrl: "/api/concepts/suggest",
  narrowerUrl: "/api/concepts/narrower",
  toModel: conceptPickerModel,
})

const licenseProvider = createConceptApiProvider({
  schemeUri: "http://uri.gbv.de/terminology/license/",
  topUrl: "https://api.dante.gbv.de/voc/top",
  conceptsUrl: "/api/concepts",
  suggestUrl: "/api/concepts/suggest",
  narrowerUrl: "/api/concepts/narrower",
  toModel: conceptPickerModel,
})

const registryProvider = createRegistryProvider(() => registriesLoaded, {
  toModel: conceptPickerModel,
})

const type = computed(() => item.type.map((uri) => ({ uri })))
const showVersionOfEditor = computed(() =>
  !props.hasIncomingVersions || item.versionOf.length > 0,
)

const requireEnglish = computed(() => !hasValidVersionOf(item))

// Use the loaded main record only if it matches the current versionOf.
// This prevents showing values from an old main record after a change.
const versionMainSource = computed(() => {
  if (!hasValidVersionOf(item) || !props.versionMain?.uri) {
    return null
  }

  const targetUri = item.versionOf[0].uri.trim()
  return targetUri === props.versionMain.uri ? props.versionMain : null
})

const jskosPreview = computed(() => {
  // Clone to avoid mutating the live form state.
  const clone = JSON.parse(JSON.stringify(item))
  const cleaned = cleanupItem(clone)
  trimItemIdentifiers(cleaned)
  return JSON.stringify(cleaned, null, 2)
})

watch(examples, (value) => {
  item.notationExamples = parseNotationExamples(value)
})

loadConcepts(
  "https://api.dante.gbv.de/voc/top",
  "http://uri.gbv.de/terminology/license/",
).then((set) => {
  licenses.value = set
})

loadConcepts("/api/voc/top", "http://w3id.org/nkos/nkostype").then((set) => {
  kostypes.value = set
})

loadConcepts("/api/voc/top", "http://bartoc.org/en/node/20000").then((set) => {
  formats.value = set
})

loadConcepts("/api/voc/top", "http://bartoc.org/en/node/20001").then((set) => {
  access.value = set
})

function itemError() {
  const validationError = validateItem(item)
  if (validationError) {
    return validationError
  }

  return abbreviationEditor.value?.validationError()
    || inheritableAbstractsEditor.value?.validationError()
    || inheritableSubjectsEditor.value?.validationError()
}

async function saveItem() {
  error.value = itemError()
  if (error.value) {
    return
  }

  const result = await saveVocabularyItem({
    item,
    auth: props.auth,
    trimItemIdentifiers,
  })

  if (result.ok) {
    window.location.href = `/en/node/${result.item.uri.split("/").pop()}`
  } else {
    error.value = result.error
  }
}

defineExpose({
  item,
  examples,
  kostypes,
  licenses,
  formats,
  access,
  registries,
  error,
  showJSKOS,
  formatScheme,
  formatProvider,
  licenseProvider,
  registryProvider,
  type,
  showVersionOfEditor,
  jskosPreview,
  itemError,
  saveItem,
  cleanupItem,
})
</script>

<style scoped>
.editor-help-text {
  display: block;
  margin-top: var(--cc-space-xs);
  color: var(--cc-color-muted);
}

.editor-display-option {
  display: flex;
  align-items: baseline;
  gap: var(--cc-space-xs);
}

.editor-actions-row {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: var(--cc-space-sm);
  margin-bottom: var(--cc-space-md);
}

.editor-error-row {
  margin-bottom: var(--cc-space-md);
}

@media (min-width: 36rem) {
  .editor-actions-row {
    flex-direction: row;
  }

  .editor-actions-row > * {
    flex: 1 1 0;
  }

  .editor-actions-row,
  .editor-error-row {
    margin-inline: calc(100% / 6);
  }
}
</style>
