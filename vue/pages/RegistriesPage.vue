<template>
  <h1>Terminology Registries</h1>
  <RegistryList />

  <p id="poster">
    <sup>*</sup> See also our poster
    <i>Terminology Registries and Services</i>
    presented at
    <a href="http://os.helmholtz.de/bewusstsein-schaerfen/workshops/rda-de-16/">
      Research Data Alliance Deutschland Treffen
    </a>
    and at <a href="http://swib.org/swib16/">SWIB 2016</a>{{ " " }}
    <a href="https://doi.org/10.5281/zenodo.166717">https://doi.org/10.5281/zenodo.166717</a>.
  </p>
</template>

<script setup>
import RegistryList from "../components/RegistryList.vue"

defineOptions({ name: "RegistriesPage" })
</script>
