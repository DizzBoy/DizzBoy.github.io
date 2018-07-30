---
layout: page
title: "Archive"
description: "文章归档"
---


<ul class="listing fa-ul">
{% for post in site.posts %}
  {% capture y %}{{post.date | date:"%Y"}}{% endcapture %}
  {% if year != y %}
    {% assign year = y %}
    <li class="listing-seperator"><i class="fa-li fa fa-minus-square"></i>{{ y }}</li>
  {% endif %}
  <li class="listing-item fa-li fa fa-circle-o">
    <time datetime="{{ post.date | date:"%Y-%m-%d" }}">{{ post.date | date:"%Y-%m-%d" }}</time>
    <a href="{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>