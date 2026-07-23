---
layout: home
title: Invited Talks
permalink: /invited-talks/
---

# Invited Talks

{% assign talks = site.data.invited-talks %}

{% if talks %}
{% assign sorted_talks = talks | sort: "sort_date" | reverse %}

<ul class="invited-talks-list">
{% for talk in sorted_talks %}
  <li>
    {{ talk.speaker }}{% if talk.title != blank %}, “{{ talk.title }},”{% endif %}
    {% if talk.venue != blank %} {{ talk.venue }}{% endif %}{% if talk.location != blank %}, {{ talk.location }}{% endif %}{% if talk.date != blank %}, {{ talk.date }}{% endif %}.{% if talk.note != blank %} {{ talk.note }}{% endif %}
    {% if talk.link %}
      <a href="{{ talk.link }}">Link</a>
    {% endif %}
  </li>
{% endfor %}
</ul>

{% else %}
<p>No invited talks listed yet.</p>
{% endif %}