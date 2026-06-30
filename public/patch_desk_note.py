#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""替换 desk-note.html 的 #app div 内容，加入底部 Tab 栏"""

import os

BASE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(BASE, 'desk-note.html')

with open(HTML, 'r', encoding='utf8') as f:
    lines = f.readlines()

# 0-indexed: #app 从第934行开始，到第982行结束
# 保留 lines[0:934] 和 lines[983:]
head = lines[:934]
tail = lines[983:]

new_body = '''  <div id="app">
    <header class="dn-header">
      <h1 class="dn-title">
        <span class="dn-title-icon">&#x1F48E;</span><span id="headerTitle">卡片笔记库</span>
      </h1>
      <div id="headerActions" style="display:flex;align-items:center;gap:8px;">
        <div id="viewSwitch" class="dn-view-switch">
          <button class="dn-view-btn is-active" data-view="card">卡片</button>
          <button class="dn-view-btn" data-view="list">列表</button>
          <button class="dn-view-btn" data-view="timeline">时间轴</button>
          <button class="dn-view-btn" data-view="calendar">日历</button>
        </div>
        <button id="doneToggle" class="dn-done-toggle" title="显示已完成">&#x2713;<span id="doneCount">0</span></button>
      </div>
    </header>

    <div class="dn-tab-panels">
      <!-- 笔记 -->
      <div class="dn-tab-panel dn-tab-panel--notes is-active" data-tab="notes">
        <div class="dn-search-wrap">
          <svg class="dn-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>
          </svg>
          <input id="searchInput" class="dn-search-input" placeholder="搜索笔记…" autocomplete="off">
          <button id="searchClear" class="dn-search-clear" style="display:none">&times;</button>
        </div>
        <div class="dn-input-area">
          <div id="inputTypeRow" class="dn-input-type-row"></div>
          <div class="dn-input-row">
            <textarea id="noteInput" class="dn-input" placeholder="快速添加随笔…" rows="2"></textarea>
            <button id="submitBtn" class="dn-submit-btn" disabled>&uarr;</button>
          </div>
          <div id="appointmentRow" class="dn-appointment-row" style="display:none">
            <div class="dn-appt-grid">
              <input id="apptPerson" class="dn-appt-input" placeholder="人物">
              <input id="apptLocation" class="dn-appt-input" placeholder="地点">
            </div>
            <div class="dn-appt-grid">
              <input id="appointmentTime" class="dn-datetime" type="datetime-local">
              <select id="apptType" class="dn-appt-select">
                <option value="">类型</option>
                <option value="interview">面试</option>
                <option value="meeting">会议</option>
                <option value="business">商务</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
        </div>
        <div id="noteList" class="dn-list"><div class="dn-empty"><div class="dn-empty-icon">&#x1F4ED;</div><p>正在加载…</p></div></div>
      </div>

      <!-- 岗位 -->
      <div class="dn-tab-panel" data-tab="jobs">
        <div class="dn-empty-state">
          <div class="dn-empty-state-icon">&#x1F4BC;</div>
          <div class="dn-empty-state-title">岗位库</div>
          <div class="dn-empty-state-desc">管理招聘岗位，跟踪招聘进度，关联候选人与简历</div>
          <button class="dn-empty-state-btn" onclick="alert('即将接入岗位管理功能')">＋ 新建岗位</button>
        </div>
      </div>

      <!-- 匹配 -->
      <div class="dn-tab-panel" data-tab="match">
        <div class="dn-empty-state">
          <div class="dn-empty-state-icon">&#x1F517;</div>
          <div class="dn-empty-state-title">匹配中心</div>
          <div class="dn-empty-state-desc">AI 智能匹配候选人与岗位，查看匹配度评分与推荐理由</div>
          <button class="dn-empty-state-btn" onclick="alert('即将接入智能匹配功能')">开始匹配</button>
        </div>
      </div>

      <!-- 人才 -->
      <div class="dn-tab-panel" data-tab="talent">
        <div class="dn-empty-state">
          <div class="dn-empty-state-icon">&#x1F465;</div>
          <div class="dn-empty-state-title">人才库</div>
          <div class="dn-empty-state-desc">管理候选人档案，记录沟通历史，跟踪面试进展</div>
          <button class="dn-empty-state-btn" onclick="alert('即将接入人才管理功能')">＋ 新建人才</button>
        </div>
      </div>

      <!-- 资源 -->
      <div class="dn-tab-panel" data-tab="resources">
        <div style="padding:16px 16px 8px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.4);">Resource Hub</div>
        <div class="dn-resource-grid">
          <div class="dn-resource-card" onclick="alert('企业库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F3ED;</span>
            <span class="dn-resource-card-label">企业库</span>
          </div>
          <div class="dn-resource-card" onclick="alert('知识库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F4DA;</span>
            <span class="dn-resource-card-label">知识库</span>
          </div>
          <div class="dn-resource-card" onclick="alert('学校库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F393;</span>
            <span class="dn-resource-card-label">学校库</span>
          </div>
          <div class="dn-resource-card" onclick="alert('图表库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F4CA;</span>
            <span class="dn-resource-card-label">图表库</span>
          </div>
          <div class="dn-resource-card" onclick="alert('信息库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F4CB;</span>
            <span class="dn-resource-card-label">信息库</span>
          </div>
          <div class="dn-resource-card" onclick="alert('人脉库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F91D;</span>
            <span class="dn-resource-card-label">人脉库</span>
          </div>
          <div class="dn-resource-card" onclick="alert('项目库 — 即将接入')">
            <span class="dn-resource-card-icon">&#x1F4E6;</span>
            <span class="dn-resource-card-label">项目库</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dn-bottom-bar">
      <button class="dn-bottom-tab is-active" data-tab="notes">
        <span class="dn-bottom-tab-icon">&#x1F4DD;</span>
        笔记
      </button>
      <button class="dn-bottom-tab" data-tab="jobs">
        <span class="dn-bottom-tab-icon">&#x1F4BC;</span>
        岗位
      </button>
      <button class="dn-bottom-tab" data-tab="match">
        <span class="dn-bottom-tab-icon">&#x1F517;</span>
        匹配
      </button>
      <button class="dn-bottom-tab" data-tab="talent">
        <span class="dn-bottom-tab-icon">&#x1F465;</span>
        人才
      </button>
      <button class="dn-bottom-tab" data-tab="resources">
        <span class="dn-bottom-tab-icon">&#x1F4E6;</span>
        资源
      </button>
    </div>
  </div>
'''

with open(HTML, 'w', encoding='utf8') as f:
    f.writelines(head)
    f.write(new_body)
    f.writelines(tail)

print('OK: desk-note.html body replaced')
