---
title:
---

<img src="/img/bartoc-logo.svg" />

<div class="main-form">
  <div class="form-group">
    <label for="browse-vocabulary">Browse vocabulary metadata</label>
    <div class="row">
      <div class="col">
        See <a href="/vocabularies">all vocabularies</a>, by type, subject, language, license...
      </div>
    </div>
  </div>
</div>

<form class="main-form" action="/vocabularies">
  <div class="form-group">
    <label for="search">Search for vocabularies</label>
    <div class="row">
      <div class="col-md-10">
        <input type="text" class="form-control" id="search" name="search">
      </div>
      <div class="col-md-2">
        <button type="submit" class="btn btn-primary">Search</button>
      </div>
    </div>
  </div>
</form>

<div class="main-form">
  <div class="form-group">
    <label>Search in vocabularies</label>
    <small class="form-text text-muted label-help">
      Several <a href="/registries?type=http://bartoc.org/full-repository">terminology services</a>
      can be used to search in selected vocabularies
    </small>
    <form class="row" action="https://bartoc-fast.ub.unibas.ch/bartocfast/" method="get">
      <div class="col-md-2">
        <a href="https://bartoc-fast.ub.unibas.ch/bartocfast">BARTOC FAST</a>
      </div>
      <div class="col-md-8">
        <input type="text" class="form-control" name="searchword">
      </div>
      <div class="col-md-2">
        <button type="submit" class="btn btn-primary mb-2">Search</button>
      </div>
    </form>
    <form class="row" action="https://api.dante.gbv.de/search" method="get">
      <div class="col-md-2">
        <a href="https://api.dante.gbv.de/">DANTE</a>
      </div>
      <div class="col-md-8">
        <input type="text" class="form-control" name="query">
        <input type="hidden" name="limit" value="10">
      </div>
      <div class="col-md-2">
        <button type="submit" class="btn btn-primary mb-2">Search</button>
      </div>
    </form>
    <form class="row" action="https://lov.linkeddata.es/dataset/lov/terms" method="get">
      <div class="col-md-2">
        <a href="https://lov.linkeddata.es/">LOV</a>
        <a href="/en/node/1721"><i class="fas fa-info-circle"></i></a>
      </div>
      <div class="col-md-8">
        <input type="text" class="form-control" name="q">
      </div>
      <div class="col-md-2">
        <button type="submit" class="btn btn-primary mb-2">Search</button>
      </div>
    </form>
  </div>
</div>

<div class="main-form">
  <div class="form-group">
    <label>Browse
      <a href="/registries">terminology registries</a>
    </label>
    <small class="form-text text-muted label-help">
      More registries, repositories and services of vocabularies
    </small>
  </div>
</div>
