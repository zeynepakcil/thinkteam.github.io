---
layout: page
title: Research Projects
permalink: /research/projects/
---
# Research Projects

<!-- <p class="usa-font-lead">The following list is a sample of research projects that the lab is involved in.</p> -->


<!-- <h2>Active</h2> -->
<!-- <table class="projects">

{% for project in site.projects %}
{% if project.active %}
<tr>
<td>
{% if project.gallery.size > 0 %}
<a href="{{project.url}}"><img class="thumb"
            src="/assets/img/publications/thumbnail/{{ project.gallery.first[0] }}"
            alt="{{ project.gallery.first[1] }}"></a>
{% endif %}
</td>
<td markdown="1">
### [{{ project.name }}]({{ project.url }})
{% if project.blurb %}
  {{ project.blurb }}
{% else %}
  {{ project.content }}
{% endif %}
</td>
</tr>
{% endif %}
{% endfor %}

</table>


<h2>Inactive</h2>
<table class="projects">

{% for project in site.projects %}
{% if project.active != true %}
<tr>
<td class="display-lg-only">
{% if project.gallery.size > 0 %}
<a href="{{project.url}}"><img class="thumb"
            src="/assets/img/publications/thumbnail/{{ project.gallery.first[0] }}"
            alt="{{ project.gallery.first[1] }}"></a>
{% endif %}
</td>
<td  markdown="1">
### [{{ project.name }}]({{ project.url }})
{% if project.blurb %}
  {{ project.blurb }}
{% else %}
  {{ project.content }}
{% endif %}
<div class="icons-row">
{% for website in project.websites %}
{% if website.primary %}
  <a href="{{ website.url }}"><div><img src="/assets/img/services/home.svg" alt="{{project.name}} website"></div></a>
{% endif %}
{% endfor %}
{% for repo in project.github_repositories %}
{% if repo.primary %}
  <a href="{{ repo.url }}"><div><img src="/assets/img/services/github.svg" alt="{{project.name}} repository"></div></a>
{% endif %}
{% endfor %}
</div>
</td>
</tr>
{% endif %}
{% endfor %}
</table>
-->
## Chiplet-Based Heterogeneous Integration

Communicating signals among multiple vertically stacked chiplets or across an entire wafer is a complex task. In some cases simple node-to-node signaling is possible, in other cases, a network architecture supporting fast, low area, and low energy communication protocols is required. Furthermore, challenges related to power delivery, thermal dissipation, test, hardware security, and synchronization, must also be addressed at scale.

## EDA for Chiplet-Based Systems

Designing chiplet-based systems is a novel challenge. A new abstraction layer must be defined that takes into account the heterogeneity of the chiplets, characteristics of the substrate, as well as addresses the large scale of such systems. Dedicated optimization algorithms and ML-based predictive models are required to enable the fast and efficient design of chiplet-based systems.

## Neuromorphic Hardware

Using charge-trap transistors (CTTs), which are fabricated in standard CMOS process, we obtain compute-in-memory devices that are able to store synaptic weights and perform a multiplication operation with incoming signals. These analog devices serve as synaptic array to analog and digital neuron designs enabling scalable low-power neural networks. We aim to build ultra-large scale neural networks useful for both ML tasks as well as brain emulation.

