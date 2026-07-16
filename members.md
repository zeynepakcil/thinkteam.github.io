---
layout: home
title: Team Members
permalink: /team/members/

hero:
  # image: /assets/img/site/hero_team.jpg TODO add team image

sidenav:
  - text: Team
    href: /team/members/
subnav:
  - text: Principal Investigator
    href: '#pi'
  #- text: Postdoctoral Fellows TODO add if any
  #  href: '#postdoc'
  - text: PhD Students
    href: '#phd'
  #- text: MS Students TODO add if any
  #  href: '#ms'
  - text: Undergraduate Students
    href: '#undergraduate'
  - text: Alumni
    href: '#alumni'
---
# Team

{% assign roles = 'pi:Principal Investigator/postdoc:Postdoctoral Fellows/phd:PhD Students/ms:MS Students/undergrad:Undergraduate Students/alumni:Alumni' | split: '/' %}

{% for role in roles %}
{% assign pair = role | split: ':' %}
<h2 id="{{pair[0]}}">{{pair[1]}}</h2>
<ul class="ul-no-bullets members-rows">
{% for member in site.members %}
{% if member.role == pair[0] %}
<li class="member-photo-item">
  <div>
    <div class="member-photo-wrapper">
      <div class="member-thumb" style="background-image: url({{ '/assets/img/members/fullsize/' | append: member.photo | relative_url }})" role="img" alt="{{member.title}}"></div>
    </div>
    <div class="member-text">
      <a href="{{ member.url | relative_url }}">{{ member.title }}</a>
      <p class="member-job-title">{{ member.job_title }}</p>
      <div class="icons-row">
        {% for service in member.services %}
          <a href="{{ service[1] }}"><div><img src="{{ '/assets/img/services/' | append: service[0] | append: '.svg' | relative_url }}" alt="{{service[0]}}"></div></a>
        {% endfor %}
      </div>
    </div>
  </div>
</li>
{% endif %}
{% endfor %}
</ul>
{% endfor %}

<!--<h2 id="alumni">Alumni</h2>
<ul class="collaborators-and-alumni-lists members-rows">
{% for member in site.members %}
{% if member.role == "alumni" %}
<li><a href="{{member.url}}">{{ member.title }}</a> ({{member.start}} - {{member.end}})<br>{{ member.job_title }}</li>
{% endif %}
{% endfor %}
</ul>

 <h2 id="collaborators">Collaborators</h2>
<ul class="collaborators-and-alumni-lists members-rows">
{% for member in site.data.collaborators %}
<li><a href="{{member[1].url}}">{{ member[1].title }}</a><br>{{member[1].affiliation}}</li>
{% endfor %}
</ul> -->
