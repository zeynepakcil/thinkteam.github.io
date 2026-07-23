---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: home

hero:
  image: /assets/img/site/hero_entrance.jpg

title: Home 
tagline: The  
 Heterogeneous  
 Integration   
 Knowledge   
 Team.
intro: |
  At THInK Team, we focus on enabling heterogeneous integration of systems. We deep dive into fine-pitch integration platforms and generate design methodologies, circuits, and EDA tools to increase system performance, reduce energy footprint, and enable novel applications. 

  Our work can be found on [Google Scholar](https://scholar.google.com/citations?user=hE2xGEMAAAAJ&hl=en){:target="_blank"}.

  Follow us for updates from [THInK Team LinkedIn Page](https://www.linkedin.com/company/thinkteam-uci){:target="_blank"}.
---
<h2>Latest News</h2>

<div class="news-box">
{% assign latest_news = site.news | reverse %}
{% for news in latest_news %}
  <div class="news-box-item">
  <h3>{{ news.title }}</h3>
    <p>
      <b>{{ news.date | date: "%-d %B %Y" }}</b> |
      {{ news.blurb }} <a href="{{ news.url | relative_url }}">More ...</a>
    </p>
  </div>
{% endfor %}
</div>