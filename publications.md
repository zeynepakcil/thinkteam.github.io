---
layout: home
title: Publications
permalink: /publications/
---

# Publications

<div class="citation-list-page">

{% assign publication_sections = "patent:Patents|book_chapter:Book Chapters|journal:Journal Papers|conference:Conference Papers" | split: "|" %}

{% for section in publication_sections %}
{% assign section_parts = section | split: ":" %}
{% assign section_id = section_parts[0] %}
{% assign section_title = section_parts[1] %}
{% assign section_publications = site.data.publications | where: "category", section_id | sort: "sort_date" | reverse %}

{% if section_publications.size > 0 %}
<h2>{{ section_title }}</h2>

<ol class="publication-list">
{% for publication in section_publications %}
  <li class="publication-list-item">
    <span class="publication-number">{{ forloop.rindex }}.</span>

    <span class="publication-citation">
      {% if publication.category == "patent" %}
        {{ publication.authors }}, “{{ publication.title }},” {{ publication.venue }}{% if publication.number %} No. {{ publication.number }}{% endif %}{% if publication.status %}, {{ publication.status | replace: "Published ", "" }}{% endif %}.

      {% elsif publication.category == "book_chapter" %}
        {{ publication.authors }}, “{{ publication.title }},” <em>{{ publication.venue }}</em>{% if publication.editor %}, {{ publication.editor }}{% endif %}{% if publication.publisher %}, {{ publication.publisher }}{% endif %}{% if publication.year %}, {{ publication.year }}{% endif %}.

      {% elsif publication.category == "journal" %}
        {{ publication.authors }}, “{{ publication.title }},” {% if publication.venue %}<em>{{ publication.venue }}</em>{% endif %}{% if publication.details %}, {{ publication.details }}{% endif %}{% if publication.year %} {{ publication.year }}{% endif %}.{% if publication.note %} <strong>{{ publication.note }}</strong>{% endif %}

      {% elsif publication.category == "conference" %}
        {{ publication.authors }}, “{{ publication.title }},” {% if publication.venue %}<em>{{ publication.venue }}</em>{% endif %}{% if publication.details %}, {{ publication.details }}{% endif %}{% if publication.year %} {{ publication.year }}{% endif %}.{% if publication.note %} <strong>{{ publication.note }}</strong>{% endif %}
      {% endif %}

      {% if publication.doi or publication.pdf or publication.code or publication.link %}
        <span class="publication-links">
          {% if publication.doi %}
            <a href="{{ publication.doi }}">DOI</a>
          {% endif %}

          {% if publication.pdf %}
            {% if publication.doi %}<span>|</span>{% endif %}
            <a href="{{ publication.pdf }}">PDF</a>
          {% endif %}

          {% if publication.code %}
            {% if publication.doi or publication.pdf %}<span>|</span>{% endif %}
            <a href="{{ publication.code }}">Code</a>
          {% endif %}

          {% if publication.link %}
            {% if publication.doi or publication.pdf or publication.code %}<span>|</span>{% endif %}
            <a href="{{ publication.link }}">Link</a>
          {% endif %}
        </span>
      {% endif %}
    </span>
  </li>
{% endfor %}
</ol>
{% endif %}

{% endfor %}

</div>