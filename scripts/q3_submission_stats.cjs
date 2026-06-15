const fs=require('fs');
const d=JSON.parse(fs.readFileSync('scripts/interrater_and_calibration_report.json','utf8'));
const labels=d.inter_rater.labels;
const cats=['REL','PARTIAL','IRR'];
// Confusion matrix
const cm={}; cats.forEach(a=>{cm[a]={};cats.forEach(b=>cm[a][b]=0)});
labels.forEach(l=>{cm[l.R1][l.R2]++});
// Per-class P/R/F1
const perClass={};
cats.forEach(c=>{
  const tp=cm[c][c];
  const fp=cats.reduce((s,k)=>s+(k!==c?cm[k][c]:0),0);
  const fn=cats.reduce((s,k)=>s+(k!==c?cm[c][k]:0),0);
  const tn=labels.length-tp-fp-fn;
  const prec=tp+fp?tp/(tp+fp):0;
  const rec=tp+fn?tp/(tp+fn):0;
  const f1=prec+rec?2*prec*rec/(prec+rec):0;
  const sens=rec, spec=tn+fp?tn/(tn+fp):0;
  perClass[c]={tp,fp,fn,tn,precision:prec,recall:rec,sensitivity:sens,specificity:spec,f1};
});
// Macro / weighted F1
const support={}; cats.forEach(c=>support[c]=labels.filter(l=>l.R1===c).length);
const macroF1=cats.reduce((s,c)=>s+perClass[c].f1,0)/cats.length;
const weightedF1=cats.reduce((s,c)=>s+perClass[c].f1*support[c],0)/labels.length;
// Weighted kappa (linear & quadratic)
const idx={REL:0,PARTIAL:1,IRR:2}; const k=cats.length;
const obs=[[0,0,0],[0,0,0],[0,0,0]];
labels.forEach(l=>{obs[idx[l.R1]][idx[l.R2]]++});
const N=labels.length;
const r1Tot=[0,0,0], r2Tot=[0,0,0];
for(let i=0;i<k;i++)for(let j=0;j<k;j++){r1Tot[i]+=obs[i][j];r2Tot[j]+=obs[i][j]}
function wk(weights){
  let num=0,den=0;
  for(let i=0;i<k;i++)for(let j=0;j<k;j++){
    const w=weights(i,j);
    const oij=obs[i][j]/N, eij=(r1Tot[i]/N)*(r2Tot[j]/N);
    num+=w*oij; den+=w*eij;
  }
  return 1-((1-num)/(1-den));
}
const linearK = wk((i,j)=>1-Math.abs(i-j)/(k-1));
const quadK   = wk((i,j)=>1-Math.pow(i-j,2)/Math.pow(k-1,2));
// Krippendorff alpha (nominal)
let Do=0,De=0;
for(let i=0;i<k;i++)for(let j=0;j<k;j++){
  if(i!==j){Do+=obs[i][j];}
}
Do=Do/N;
const tot=[0,0,0]; for(let i=0;i<k;i++)tot[i]=r1Tot[i]+r2Tot[i];
const totN=2*N;
for(let i=0;i<k;i++)for(let j=0;j<k;j++){if(i!==j)De+=tot[i]*tot[j];}
De=De/(totN*(totN-1));
const krippAlpha=1-Do/De;
// Sample size justification (Sim & Wright 2005, normal approx)
// SE(κ) ≈ sqrt(p0(1-p0) / (N*(1-pe)^2)) — back-solve N for given precision
const p0=d.inter_rater.po, pe=d.inter_rater.pe;
const targetCI=0.10; // ±0.10 width
const z=1.96;
const seTarget=targetCI/z;
const N_needed=Math.ceil(p0*(1-p0)/(seTarget*seTarget*Math.pow(1-pe,2)));
// Output
const out={
  confusion_matrix: cm,
  per_class: perClass,
  support,
  macro_f1: +macroF1.toFixed(4),
  weighted_f1: +weightedF1.toFixed(4),
  cohen_kappa: d.inter_rater.kappa,
  weighted_kappa_linear: +linearK.toFixed(4),
  weighted_kappa_quadratic: +quadK.toFixed(4),
  krippendorff_alpha_nominal: +krippAlpha.toFixed(4),
  sample_size_justification: {
    method: 'Sim & Wright (2005), normal approximation',
    observed_p0: p0, observed_pe: pe, observed_kappa: d.inter_rater.kappa,
    target_CI_width: targetCI, z: z,
    n_required_for_target_precision: N_needed,
    n_actual: labels.length,
    interpretation: labels.length>=N_needed
      ? `Mevcut n=${labels.length}, hedef ±${targetCI} CI için yeterli (gerekli n=${N_needed}).`
      : `Mevcut n=${labels.length}; ±${targetCI} CI hassasiyeti için n=${N_needed} gerekir. Mevcut CI bu yüzden geniş [${d.inter_rater.ci95_bootstrap.lo.toFixed(3)}–${d.inter_rater.ci95_bootstrap.hi.toFixed(3)}].`
  }
};
fs.writeFileSync('scripts/q3_submission_stats_report.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
