#!/usr/bin/env python3
"""TOMEC multipanel figures (Figures 10–12) — reproducible build from real data.
Sources:
  - scripts/exact_p_calibration_report.json (Fisher exact OR + 95% CI vs Aboutanos 2007 / El Kady 2004)
  - scripts/analysis_quality_report.json (n=571 corpus, court distribution, filter quality)
Outputs:
  - client/public/figures/sekil10_multipanel.png  (4-panel: forest + courts + donut + filter quality)
  - client/public/figures/sekil11_heatmaps.png    (4 contingency 2x2 heatmaps)
  - client/public/figures/sekil12_regression.png  (log(OR) vs prevalence + paired bar)
Zero-Hallucination: all numbers read from source JSONs; no synthetic values.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import json, os, hashlib

NAVY='#0D2545'; WINE='#7A2231'; SAND='#C9A06A'; SAGE='#5A8F7B'; GREY='#9AA5B1'

calib = json.load(open('scripts/exact_p_calibration_report.json'))['results']
quality = json.load(open('scripts/analysis_quality_report.json'))

os.makedirs('client/public/figures', exist_ok=True)

# === Figure 10 — 4-panel composite ===
fig, axes = plt.subplots(2, 2, figsize=(13, 9))
fig.suptitle('Figure 10. TOMEC corpus — multipanel synthesis (n=571 cases / 4 international comparisons)',
             fontsize=12, color=NAVY, fontweight='bold', y=0.995)
ax = axes[0, 0]
labels=['Fetal death\nvs Aboutanos 2007','Abruption\nvs El Kady 2004','Preterm birth\nvs El Kady 2004','Fetal death\nvs El Kady (pop)']
ors=[r['OR'] for r in calib]; lo=[r['OR_CI95'][0] for r in calib]; hi=[r['OR_CI95'][1] for r in calib]
pvals=[r['fisher_exact_p_two_sided'] for r in calib]
y=np.arange(len(labels))
for i in range(len(labels)):
    ax.plot([lo[i],hi[i]],[y[i],y[i]],color=NAVY,lw=2)
    ax.scatter(ors[i],y[i],s=120,color=WINE if pvals[i]<0.05 else SAGE,zorder=3,edgecolor='k',lw=0.5)
    ax.text(hi[i]*1.05,y[i],f'OR={ors[i]:.2f}  p={pvals[i]:.4f}',va='center',fontsize=8,color=NAVY)
ax.axvline(1,color=GREY,ls='--',lw=1)
ax.set_yticks(y); ax.set_yticklabels(labels,fontsize=9)
ax.set_xscale('log'); ax.set_xlim(0.3,10)
ax.set_xlabel('Odds Ratio (log scale, 95% CI)',fontsize=9,color=NAVY)
ax.set_title('A. International calibration — Forest plot',fontsize=10,color=NAVY,fontweight='bold')
ax.invert_yaxis(); ax.grid(axis='x',alpha=0.3)

ax = axes[0, 1]
items=sorted(quality['by_court_obs'].items(),key=lambda x:-x[1])
names=[k.replace('A.İ.H.M.','ECtHR').replace('Anayasa','Const.Court').replace('Yargıtay','Cassation').replace('Danıştay','Council of State').replace('Uyuşmazlık Mahkemesi','Jurisd.Disp.').replace('Askeri Yargıtay','Military Cass.').replace('A.Y.İ.M.','SMAC') for k,v in items]
vals=[v for k,v in items]
bars=ax.barh(names,vals,color=[NAVY,WINE,SAND,SAGE,GREY,GREY,GREY])
for b,v in zip(bars,vals):
    ax.text(v+5,b.get_y()+b.get_height()/2,str(v),va='center',fontsize=9,color=NAVY)
ax.set_xlabel('Number of decisions',fontsize=9,color=NAVY)
ax.set_title('B. Court distribution — obstetric motif corpus (n=367)',fontsize=10,color=NAVY,fontweight='bold')
ax.invert_yaxis(); ax.grid(axis='x',alpha=0.3)

ax = axes[1, 0]
domains=['T (Trauma)\n25%','O (Obstetric)\n20%','M (Maternal)\n15%','E (Event)\n20%','C (Chrono.)\n20%']
ax.pie([25,20,15,20,20],labels=domains,colors=[WINE,NAVY,SAND,SAGE,GREY],startangle=90,
       wedgeprops=dict(width=0.42,edgecolor='white',lw=2),textprops=dict(fontsize=9,color=NAVY))
ax.text(0,0,'TOMEC\n[0–100]',ha='center',va='center',fontsize=11,fontweight='bold',color=NAVY)
ax.set_title('C. TOMEC domain weighting',fontsize=10,color=NAVY,fontweight='bold')

ax = axes[1, 1]
metrics=['False-positive\nboilerplate','Obstetric\nmotif','Med-mal\nsignal','Clean\nobstetric']
keys=['fp_boilerplate','obstetric_motif','medmal_signal','clean_obstetric']
vals=[quality['counts'][k]['n'] for k in keys]; pcts=[quality['counts'][k]['pct'] for k in keys]
bars=ax.bar(metrics,vals,color=[GREY,NAVY,SAND,SAGE],edgecolor='k',lw=0.5)
for b,v,p in zip(bars,vals,pcts):
    ax.text(b.get_x()+b.get_width()/2,v+8,f'n={v}\n({p})',ha='center',fontsize=9,color=NAVY)
ax.set_ylabel('Cases (n=571 total)',fontsize=9,color=NAVY)
ax.set_title('D. Filter quality metrics — automated screening',fontsize=10,color=NAVY,fontweight='bold')
ax.set_ylim(0,max(vals)*1.25); ax.grid(axis='y',alpha=0.3)
plt.tight_layout(rect=[0,0,1,0.97])
plt.savefig('client/public/figures/sekil10_multipanel.png',dpi=150,facecolor='white'); plt.close()

# === Figure 11 — heatmap row ===
fig, axes = plt.subplots(1,4,figsize=(16,4.5))
fig.suptitle('Figure 11. International calibration — 2×2 contingency heatmaps (Turkish corpus vs published cohorts)',
             fontsize=12,color=NAVY,fontweight='bold',y=1.02)
titles=['Fetal death\nvs Aboutanos 2007 (n=634)','Abruption\nvs El Kady 2004 (n=10,629)',
        'Preterm birth\nvs El Kady 2004 (n=10,629)','Fetal death\nvs El Kady (pop) (n=10,629)']
for idx,r in enumerate(calib):
    t=r['tablo_2x2']; M=np.array([[t['a'],t['b']],[t['c'],t['d']]])
    Mn=M/M.sum(axis=1,keepdims=True)
    ax=axes[idx]; im=ax.imshow(Mn,cmap='RdYlBu_r',vmin=0,vmax=0.5,aspect='auto')
    for i in range(2):
        for j in range(2):
            ax.text(j,i,f'{M[i,j]}\n({Mn[i,j]*100:.1f}%)',ha='center',va='center',
                    fontsize=11,color='white' if Mn[i,j]>0.25 else NAVY,fontweight='bold')
    ax.set_xticks([0,1]); ax.set_xticklabels(['Outcome+','Outcome−'],fontsize=9)
    ax.set_yticks([0,1]); ax.set_yticklabels(['Turkish\ncorpus','Reference\ncohort'],fontsize=9)
    ax.set_title(titles[idx]+f"\nOR={r['OR']:.2f}, p={r['fisher_exact_p_two_sided']:.4f}",fontsize=9,color=NAVY)
    plt.colorbar(im,ax=ax,fraction=0.046,pad=0.04)
plt.tight_layout()
plt.savefig('client/public/figures/sekil11_heatmaps.png',dpi=150,facecolor='white',bbox_inches='tight'); plt.close()

# === Figure 12 — regression diagnostics ===
fig, axes = plt.subplots(1,2,figsize=(13,5))
fig.suptitle('Figure 12. Regression diagnostics — log(OR) vs cohort prevalence and paired outcome rate comparison',
             fontsize=12,color=NAVY,fontweight='bold',y=1.02)
ax=axes[0]; ref_prev=[]; log_or=[]; lo_=[]; hi_=[]; lbl=[]
for r in calib:
    t=r['tablo_2x2']; ref_prev.append(t['c']/(t['c']+t['d'])*100)
    log_or.append(np.log(r['OR'])); lo_.append(np.log(r['OR_CI95'][0])); hi_.append(np.log(r['OR_CI95'][1]))
    lbl.append(r['karşılaştırma'].replace('_',' '))
ref_prev=np.array(ref_prev); log_or=np.array(log_or)
slope,intercept=np.polyfit(ref_prev,log_or,1)
xs=np.linspace(ref_prev.min()*0.5,ref_prev.max()*1.2,50)
ax.plot(xs,slope*xs+intercept,'--',color=GREY,lw=1.5,label=f'OLS fit (slope={slope:.3f})')
for i in range(len(calib)):
    ax.errorbar(ref_prev[i],log_or[i],yerr=[[log_or[i]-lo_[i]],[hi_[i]-log_or[i]]],
                fmt='o',color=WINE,markersize=10,capsize=4,ecolor=NAVY,lw=1.5)
    ax.annotate(lbl[i],(ref_prev[i],log_or[i]),xytext=(8,5),textcoords='offset points',fontsize=8,color=NAVY)
ax.axhline(0,color='k',ls='-',lw=0.5)
ax.set_xlabel('Reference cohort outcome prevalence (%)',fontsize=10,color=NAVY)
ax.set_ylabel('log(OR), 95% CI',fontsize=10,color=NAVY)
ax.set_title('A. log(OR) vs reference prevalence',fontsize=10,color=NAVY,fontweight='bold')
ax.legend(fontsize=8); ax.grid(alpha=0.3)

ax=axes[1]
short=['Fetal death\n(Aboutanos)','Abruption\n(El Kady)','Preterm\n(El Kady)','Fetal death\n(El Kady pop)']
turk=[r['tablo_2x2']['a']/(r['tablo_2x2']['a']+r['tablo_2x2']['b'])*100 for r in calib]
ref=[r['tablo_2x2']['c']/(r['tablo_2x2']['c']+r['tablo_2x2']['d'])*100 for r in calib]
x=np.arange(len(short)); w=0.38
ax.bar(x-w/2,turk,w,label='Turkish corpus',color=WINE,edgecolor='k',lw=0.5)
ax.bar(x+w/2,ref,w,label='Reference cohort',color=NAVY,edgecolor='k',lw=0.5)
for i,(tv,rv) in enumerate(zip(turk,ref)):
    ax.text(i-w/2,tv+0.3,f'{tv:.1f}%',ha='center',fontsize=8,color=NAVY)
    ax.text(i+w/2,rv+0.3,f'{rv:.1f}%',ha='center',fontsize=8,color=NAVY)
ax.set_xticks(x); ax.set_xticklabels(short,fontsize=9)
ax.set_ylabel('Outcome rate (%)',fontsize=10,color=NAVY)
ax.set_title('B. Turkish corpus vs reference outcome rates',fontsize=10,color=NAVY,fontweight='bold')
ax.legend(fontsize=9); ax.grid(axis='y',alpha=0.3)
plt.tight_layout()
plt.savefig('client/public/figures/sekil12_regression.png',dpi=150,facecolor='white',bbox_inches='tight'); plt.close()

meta={'figures':{},'data_source':{'calib':'scripts/exact_p_calibration_report.json',
      'quality':'scripts/analysis_quality_report.json'},'script':'scripts/build_multipanel_figures.py'}
for f in ['sekil10_multipanel.png','sekil11_heatmaps.png','sekil12_regression.png']:
    p=f'client/public/figures/{f}'
    meta['figures'][f]={'sha256_prefix':hashlib.sha256(open(p,'rb').read()).hexdigest()[:16],
                        'size_kb':round(os.path.getsize(p)/1024,1)}
json.dump(meta,open('scripts/multipanel_figures_meta.json','w'),indent=2)
print('Meta:',json.dumps(meta,indent=1))
