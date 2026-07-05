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
    {{ talk.speaker }}, “{{ talk.title }},”
    {% if talk.venue %}{{ talk.venue }}{% endif %}{% if talk.location %}, {{ talk.location }}{% endif %}{% if talk.date %}, {{ talk.date }}{% endif %}.{% if talk.note %} {{ talk.note }}{% endif %}
    {% if talk.link %}
      <a href="{{ talk.link }}">Link</a>
    {% endif %}
  </li>
{% endfor %}
</ul>

{% else %}
<p>No invited talks listed yet.</p>
{% endif %}