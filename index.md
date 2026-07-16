---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: home

hero:
  image: /assets/img/site/hero_entrance.jpg

title: THInK Team 
tagline: The Heterogeneous Integration Knowledge Team.
intro: |
  At THInK Team, we focus on enabling heterogeneous integration of systems. We deep dive into fine-pitch integration platforms and generate design methodologies, circuits, and EDA tools to increase system performance, reduce energy footprint, and enable novel applications. 

  Our work can always be found on [Google Scholar](https://scholar.google.com/citations?user=hE2xGEMAAAAJ&hl=en).
---

# THInK Team 

<div class="usa-grid-full">
  <div class="usa-width-one-third">
  <h2>Latest News</h2>
  </div>
  <div class="usa-width-two-thirds">
  {% assign latest_news = site.news | reverse | slice: 0,5 %}
  {% for news in latest_news %}
    <h3>{{ news.title }}</h3>
      <p>
        <b>{{ news.date | date: "%-d %B %Y" }}</b> |
        {{ news.blurb }} <a href="{{ news.url | relative_url }}">More ...</a>
      </p>
  {% endfor %}
  </div>
</div>
