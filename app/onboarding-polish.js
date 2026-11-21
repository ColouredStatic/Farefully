/* Farefully onboarding comfort layer. Preserves the existing planner and safety logic. */
(function(){
  'use strict';
  function byId(id){return document.getElementById(id);}
  function numberOf(id, fallback){var n=Number(byId(id)?.value);return Number.isFinite(n)?n:fallback;}
  function update(){
    var setup=byId('setup');
    if(!setup)return;
    var step=1;
    for(var i=1;i<=6;i++){if(byId('setupStep'+i)?.classList.contains('show')){step=i;break;}}
    var steps=['Your household','Your food budget','Family favourites','Your dinner style','Dietary needs','Final touches'];
    var n=byId('ffSetupNumber'),label=byId('ffSetupLabel');
    if(n)n.textContent='Step '+step+' of 6';
    if(label)label.textContent=steps[step-1];
    var adults=Math.max(1,Math.floor(numberOf('adults',2)));
    var children=Math.max(0,Math.floor(numberOf('children',0)));
    var total=adults+children;
    var totalEl=byId('ffHouseholdTotal');
    if(totalEl)totalEl.textContent='Planning for '+total+' '+(total===1?'person':'people')+'. Portions and ingredient quantities will be scaled to your household.';
    var budget=Math.max(0,numberOf('budget',0)), days=Math.max(1,numberOf('planDays',7));
    var daily=byId('ffBudgetDaily');
    if(daily)daily.textContent=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(budget/days);
    var per=byId('ffBudgetLabel');
    if(per)per.textContent='daily share of your '+days+'-day budget target, not a supermarket price quote';
    var selected=document.querySelector('#setup [data-priority].on')?.dataset.priority||'balance';
    document.querySelectorAll('[data-ff-vibe]').forEach(function(btn){
      var on=btn.dataset.ffVibe===selected;
      btn.setAttribute('aria-pressed',on?'true':'false');
    });
    var summary=byId('ffPlanSummary');
    if(summary){
      var store=byId('supermarket')?.value||'No supermarket selected';
      var diet=byId('dietPattern')?.selectedOptions[0]?.textContent||'No specific diet';
      var priority=({budget:'Keep costs down',family:'Family favourites',quick:'Quick cooking',variety:'Try new things',balance:'A balanced mix'})[selected]||'A balanced mix';
      summary.textContent=total+' '+(total===1?'person':'people')+' · '+days+' days\n'+new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(budget)+' budget · '+store+'\n'+priority+' · '+diet;
    }
  }
  function init(){
    if(!byId('setup')||!byId('setupStep1'))return;
    document.querySelectorAll('[data-ff-count]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var el=byId(btn.dataset.ffCount),min=Number(el?.min||0),max=Number(el?.max||30);
        if(!el)return;
        el.value=String(Math.min(max,Math.max(min,(Math.floor(Number(el.value)||0)+Number(btn.dataset.delta||0)))));
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
        update();
      });
    });
    document.querySelectorAll('[data-ff-vibe]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var vibe=btn.dataset.ffVibe;
        var primary=document.querySelector('#setup [data-priority="'+vibe+'"]');
        if(primary)primary.click();
        var novelty=byId('novelty'),time=byId('maxTime');
        if(novelty&&(vibe==='family'||vibe==='variety'||vibe==='balance')){
          novelty.value=vibe==='family'?'familiar':vibe==='variety'?'adventurous':'balanced';
          novelty.dispatchEvent(new Event('change',{bubbles:true}));
        }
        if(time&&vibe==='quick'){time.value='30';time.dispatchEvent(new Event('change',{bubbles:true}));}
        update();
      });
    });
    ['adults','children','budget','planDays','supermarket','dietPattern','novelty','maxTime'].forEach(function(id){
      var el=byId(id);
      if(el){el.addEventListener('input',update);el.addEventListener('change',update);}
    });
    byId('setup').addEventListener('click',function(){setTimeout(update,0);});
    var observer=new MutationObserver(update);
    for(var i=1;i<=6;i++){var step=byId('setupStep'+i);if(step)observer.observe(step,{attributes:true,attributeFilter:['class']});}
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
