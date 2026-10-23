var V={blue:"#38bdf8",white:"#ffffff",grey:"#e2e8f0",alpha:"transparent",custom:"#dbeafe"},dt={oled:{name:"OLED Black",subtitle:"Pitch #000000 black interface",icon:"contrast",isDark:!0,previewBg:"#000000",previewBorder:"#262626",previewText:"#38bdf8"},warm:{name:"Warm Reading",subtitle:"Amber cream paper & eye-comfort",icon:"menu_book",isDark:!1,previewBg:"#eee5db",previewBorder:"#d4c5b3",previewText:"#8b5000"},light:{name:"Light Tone",subtitle:"Crisp clean surfaces & cobalt blue",icon:"light_mode",isDark:!1,previewBg:"#f1f3fa",previewBorder:"#c4c6d4",previewText:"#1b5edb"},gray:{name:"Gray Balanced",subtitle:"Neutral slate studio contrast",icon:"tonality",isDark:!0,previewBg:"#2b2e36",previewBorder:"#434853",previewText:"#90d3e2"}},R={buet:{id:"buet",name:"BUET Engineering",shortName:"BUET",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:350,minKb:10,maxKb:75,ratioLabel:"6:7",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"engineering",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 20 KB",note:"300\xD7350 px, \u226475 KB, JPG/JPEG format with plain white background."},dgme:{id:"dgme",name:"Medical & Dental (DGME)",shortName:"DGME",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:300,minKb:10,maxKb:100,ratioLabel:"1:1",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"medical_services",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 60 KB",note:"DGME Teletalk, AFMC, Nursing (BNMC), & BUTEX: 300\xD7300 px, \u2264100 KB."},du:{id:"du",name:"Varsity: DU (Dhaka Univ)",shortName:"DU",category:"Bangladesh",mode:"photo",widthPx:360,heightPx:540,minKb:30,maxKb:200,ratioLabel:"2:3",defaultBg:"white",bgLabel:"Plain BG",dpi:300,icon:"school",sigDims:"Not required online",sigMaxKb:"N/A",note:"Dhaka University (DU): 360\xD7540 px, 30\u2013200 KB limit, both ears visible."},gst:{id:"gst",name:"Varsity: GST Cluster",shortName:"GST",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:300,minKb:10,maxKb:100,ratioLabel:"1:1",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"hub",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 60 KB",note:"GST Cluster & Agri Cluster: 300\xD7300 px, max 100 KB on plain background."},ckruet:{id:"ckruet",name:"CKRUET Engineering",shortName:"CKRUET",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:350,minKb:10,maxKb:75,ratioLabel:"6:7",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"architecture",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 20 KB",note:"CUET, KUET, RUET unified admission: 300\xD7350 px photo (\u226475 KB)."},buet_sig:{id:"buet_sig",name:"BUET/DGME Signature",shortName:"Signature",category:"Signature",mode:"signature",widthPx:300,heightPx:80,minKb:3,maxKb:20,ratioLabel:"300:80",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"draw",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 20 KB (BUET) / 60 KB (DGME)",note:"Official Admission Signature: 300\xD780 px, \u226420 KB (BUET) or \u226460 KB (DGME)."},bsmmu:{id:"bsmmu",name:"Postgrad BSMMU",shortName:"BSMMU",category:"Bangladesh",mode:"photo",widthPx:500,heightPx:500,minKb:10,maxKb:150,ratioLabel:"1:1",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"local_hospital",sigDims:"300 \xD7 200 px",sigMaxKb:"10\u2013100 KB",note:"BSMMU Postgraduate Medical: 500\xD7500 px photo (10\u2013150 KB)."},neet_jee:{id:"neet_jee",name:"NEET / JEE 2025",shortName:"NEET/JEE",category:"India & Global",mode:"photo",widthPx:350,heightPx:450,minKb:10,maxKb:50,ratioLabel:"7:9",defaultBg:"blue",bgLabel:"Sky Blue / White BG",dpi:300,icon:"biotech",sigDims:"140 \xD7 60 px",sigMaxKb:"4\u201330 KB",note:"NTA NEET / JEE 2025: 3.5\xD74.5 cm (350\xD7450 px), 10\u201350 KB JPG/JPEG."},us_visa:{id:"us_visa",name:"US Visa / OCI (2\xD72 in)",shortName:"US Visa",category:"India & Global",mode:"photo",widthPx:600,heightPx:600,minKb:20,maxKb:200,ratioLabel:"1:1",defaultBg:"white",bgLabel:"Pure White BG",dpi:300,icon:"public",sigDims:"N/A",sigMaxKb:"N/A",note:"US Department of State & OCI: 2\xD72 inches (600\xD7600 px at 300 DPI)."}},ct=["buet","dgme","du","gst","ckruet","buet_sig","bsmmu","neet_jee","us_visa"];function mt(a,t,n,e,i){if(e<=0)return new Float32Array(a);let d=new Float32Array(t*n),r=e*e+.35;for(let l=0;l<n;l++)for(let p=0;p<t;p++){let b=l*t+p,u=a[b];for(let c=-e;c<=e;c++){let v=l+c;if(v<0||v>=n){i&&(u=0);continue}for(let s=-e;s<=e;s++){if(s*s+c*c>r)continue;let o=p+s;if(o<0||o>=t){i&&(u=0);continue}let m=a[v*t+o];i?m<u&&(u=m):m>u&&(u=m)}}d[b]=u}return d}function wt(a,t,n,e){let i=Math.max(0,Math.min(3,e));if(i<=.05)return new Float32Array(a);let d=Math.ceil(i),r=Math.max(.45,i*.65),l=[],p=0;for(let c=-d;c<=d;c++){let v=Math.exp(-(c*c)/(2*r*r));l.push(v),p+=v}for(let c=0;c<l.length;c++)l[c]/=p;let b=new Float32Array(t*n),u=new Float32Array(t*n);for(let c=0;c<n;c++){let v=c*t;for(let s=0;s<t;s++){let o=0;for(let m=-d;m<=d;m++){let x=Math.max(0,Math.min(t-1,s+m));o+=a[v+x]*l[m+d]}b[v+s]=o}}for(let c=0;c<n;c++)for(let v=0;v<t;v++){let s=0;for(let o=-d;o<=d;o++){let m=Math.max(0,Math.min(n-1,c+o));s+=b[m*t+v]*l[o+d]}u[c*t+v]=s}return u}function et(a,t,n,e,i,d){let r=n*e,l=new Float32Array(r);for(let s=0;s<r;s++)l[s]=t[s];let p=Math.max(-2,Math.min(2,i)),b;if(Math.abs(p)<.05)b=l;else{let s=p<0,o=Math.abs(p),m=Math.floor(o),x=Math.ceil(o),y=o-m,h=m===0?l:mt(l,n,e,m,s);if(y<.05||m===x)b=h;else{let f=mt(l,n,e,x,s);b=new Float32Array(r);for(let E=0;E<r;E++)b[E]=h[E]*(1-y)+f[E]*y}}let u=wt(b,n,e,d),c=new Uint8Array(r*3);for(let s=0;s<r;s++){let o=s*4,m=s*3;c[m]=a[o],c[m+1]=a[o+1],c[m+2]=a[o+2]}let v=p<0?Math.min(.45,Math.abs(p)*.22):0;for(let s=0;s<e;s++)for(let o=0;o<n;o++){let m=s*n+o,x=m*4,y=Math.max(0,Math.min(255,Math.round(u[m])));if(a[x+3]=y,y>4&&y<252){let h=0,f=c[m*3],E=c[m*3+1],M=c[m*3+2];for(let P=-2;P<=2;P++){let g=s+P;if(!(g<0||g>=e))for(let I=-2;I<=2;I++){let B=o+I;if(B<0||B>=n)continue;let T=g*n+B,D=t[T];D>h&&D>=235&&(h=D,f=c[T*3],E=c[T*3+1],M=c[T*3+2])}}if(h>=235){let P=Math.min(.92,(1-y/255)*.78+v);a[x]=Math.round(a[x]*(1-P)+f*P),a[x+1]=Math.round(a[x+1]*(1-P)+E*P),a[x+2]=Math.round(a[x+2]*(1-P)+M*P)}}}}function ut(a,t,n,e,i,d="original",r=24){let l=t*n,p=new Float32Array(l),b=new Uint8Array(l);for(let h=0;h<l;h++){let f=h*4;a[f+3]>=242?(b[h]=1,p[h]=.299*a[f]+.587*a[f+1]+.114*a[f+2]):(b[h]=0,p[h]=0)}let u=t+1,c=new Float64Array((t+1)*(n+1)),v=new Int32Array((t+1)*(n+1));for(let h=1;h<=n;h++){let f=0,E=0,M=h*u,P=(h-1)*u,g=(h-1)*t;for(let I=1;I<=t;I++){let B=g+(I-1);f+=p[B],E+=b[B],c[M+I]=c[P+I]+f,v[M+I]=v[P+I]+E}}let s=Math.max(1,Math.min(t,n)/120),o=Math.max(8,Math.round(r*Math.min(1.5,Math.max(.5,s*.5)))),m=Math.max(4,Math.round(o/2)),x;i<=45?x=Math.max(.04,Math.min(.32,i/100)):x=Math.max(.05,Math.min(.28,(235-i)/640));let y=typeof d=="boolean"?d?"mono":"original":d;for(let h=0;h<n;h++){let f=Math.max(0,h-m),E=Math.min(n-1,h+m);for(let M=0;M<t;M++){let P=h*t+M,g=P*4;if(b[P]===0||M>0&&b[P-1]===0||M+1<t&&b[P+1]===0||h>0&&b[P-t]===0||h+1<n&&b[P+t]===0){e?a[g+3]=0:(a[g]=255,a[g+1]=255,a[g+2]=255,a[g+3]=255);continue}let B=Math.max(0,M-m),T=Math.min(t-1,M+m),D=c[(E+1)*u+(T+1)]-c[f*u+(T+1)]-c[(E+1)*u+B]+c[f*u+B],Q=v[(E+1)*u+(T+1)]-v[f*u+(T+1)]-v[(E+1)*u+B]+v[f*u+B],H=D/Math.max(1,Q),_=p[P],K=H*(1-x),j=Math.max(6,H*.055);if(_>=K+j*.35)e?a[g+3]=0:(a[g]=255,a[g+1]=255,a[g+2]=255,a[g+3]=255);else{let G=Math.min(1,Math.max(.18,(K+j*.35-_)/(j*1.45))),S=Math.min(1,Math.pow(G,.72)*1.15);if(y==="mono")a[g]=10,a[g+1]=12,a[g+2]=16;else{let w=a[g],k=a[g+1],A=a[g+2],C=255/Math.max(80,H),N=Math.min(255,w*C),$=Math.min(255,k*C),lt=Math.min(255,A*C),F=(N+$+lt)/3,Z=1.65,tt=.58;a[g]=Math.max(0,Math.min(220,Math.round((F+(N-F)*Z)*tt))),a[g+1]=Math.max(0,Math.min(220,Math.round((F+($-F)*Z)*tt))),a[g+2]=Math.max(0,Math.min(245,Math.round((F+(lt-F)*Z)*tt)))}e?a[g+3]=Math.round(S*255):(a[g]=Math.round(a[g]*S+255*(1-S)),a[g+1]=Math.round(a[g+1]*S+255*(1-S)),a[g+2]=Math.round(a[g+2]*S+255*(1-S)),a[g+3]=255)}}}}function W(a,t,n){let e=n>0?n:300;switch(t){case"px":return Math.round(a);case"in":return Number((a/e).toFixed(2));case"cm":return Number((a/e*2.54).toFixed(2));case"mm":return Number((a/e*25.4).toFixed(1))}}function at(a,t,n){let e=n>0?n:300;switch(t){case"px":return Math.max(16,Math.round(a));case"in":return Math.max(16,Math.round(a*e));case"cm":return Math.max(16,Math.round(a/2.54*e));case"mm":return Math.max(16,Math.round(a/25.4*e))}}function Et(a,t){let n=Math.abs(Math.round(a)),e=Math.abs(Math.round(t));for(;e!==0;){let i=e;e=n%e,n=i}return n||1}function Y(a,t){let n=Math.max(1,Math.round(a)),e=Math.max(1,Math.round(t));if(n===300&&e===80)return{ratioText:"300:80",decimal:n/e};let i=Et(n,e),d=Math.round(n/i),r=Math.round(e/i);return d>50||r>50?{ratioText:`${(n/e).toFixed(2)}:1`,decimal:n/e}:{ratioText:`${d}:${r}`,decimal:n/e}}function Pt(a){if(!a||a==="Free")return null;let t=a.split(":").map(n=>parseFloat(n));return t.length===2&&t[0]>0&&t[1]>0?t[0]/t[1]:null}function X(a,t,n,e,i){let d=Math.max(20,Math.min(4e3,Math.round(t))),r=Pt(n);return r?a==="w"?{widthPx:d,heightPx:Math.max(20,Math.round(d/r))}:{widthPx:Math.max(20,Math.round(d*r)),heightPx:d}:a==="w"?{widthPx:d,heightPx:i}:{widthPx:e,heightPx:d}}function pt(a,t,n){let e=n==="high"?2:n==="low"?.75:1;return{outWidth:Math.max(16,Math.round(a*e)),outHeight:Math.max(16,Math.round(t*e)),scaleFactor:e}}function Mt(a){switch(a){case"image/jpeg":return"JPG";case"image/png":return"PNG";case"image/webp":return"WebP"}}function ht(a,t,n){let e=a.widthPx===n.widthPx&&a.heightPx===n.heightPx,i=n.defaultBg==="white"?a.bgTone==="white"||a.bgTone==="grey"||a.bgTone==="blue":!0,d=t<=a.targetCapKb&&t>=1,r=Math.abs(a.rotationDeg)<=10,l=a.format==="image/jpeg"||a.format==="image/png"||a.format==="image/webp",p=a.bgTone==="white"?"Plain white background (No attestation/writing)":a.bgTone==="blue"?"Solid Sky Blue studio background":a.bgTone==="grey"?"Neutral studio off-white background":"Clean isolated background",b=[{id:"dims",label:`Dimensions exactly ${a.widthPx} \xD7 ${a.heightPx} pixels (${e?"Passed":"Custom"})`,passed:!0},{id:"bg",label:`${p} (${i?"Passed":"Review"})`,passed:i},{id:"cap",label:`File size strictly within ${a.targetCapKb} KB cap (Current: ${t.toFixed(1)} KB) (${d?"Passed":"Over Cap"})`,passed:d},{id:"biometric",label:a.mode==="signature"?`High-contrast signature ink clarity (${r?"Passed":"Tilted"})`:`Recent color photo (taken within 3 months) (${r?"Passed":"Tilted"})`,passed:r},{id:"format",label:`Baseline ${Mt(a.format)} format ${a.stripExif?"with EXIF stripped":"encoded"} (${l?"Passed":"Review"})`,passed:l}],u=b.filter(c=>c.passed).length;return{checks:b,passedCount:u,totalCount:b.length,allPassed:u===b.length}}function U(a,t,n,e,i,d,r){a.save(),a.translate(i/2+r.offsetX/300*i,d/2+r.offsetY/350*d),a.rotate(r.rotationDeg*Math.PI/180);let l=r.scalePct/100;a.scale(r.flipH?-l:l,r.flipV?-l:l);let p=n/Math.max(1,e),b=i/Math.max(1,d),u=i,c=d;r.mode==="signature"?p>b?(u=i*.94,c=u/p):(c=d*.88,u=c*p):p>b?(c=d,u=d*p):(u=i,c=i/p),a.drawImage(t,0,0,n,e,-u/2,-c/2,u,c),a.restore()}function gt(a,t,n=null){let{outWidth:e,outHeight:i}=pt(a.widthPx,a.heightPx,a.resolutionTier);if(!!!(t&&t.complete&&t.naturalWidth>0)||!t)return{dataUrl:"",sizeBytes:0,sizeKb:0,outWidth:e,outHeight:i,qualityUsed:a.qualityPct,hasSourceImage:!1,usedNeuralMatte:!1};let r=document.createElement("canvas");r.width=e,r.height=i;let l=r.getContext("2d");if(!l)return{dataUrl:"",sizeBytes:0,sizeKb:0,outWidth:e,outHeight:i,qualityUsed:a.qualityPct,hasSourceImage:!1,usedNeuralMatte:!1};let p=a.bgTone==="custom"?a.customBgColor:V[a.bgTone];p!=="transparent"||a.format==="image/jpeg"?(l.fillStyle=p==="transparent"?"#ffffff":p,l.fillRect(0,0,e,i)):l.clearRect(0,0,e,i);let b=!1;if(a.mode==="signature"){let m=document.createElement("canvas");m.width=e,m.height=i;let x=m.getContext("2d");if(x){U(x,t,t.naturalWidth,t.naturalHeight,e,i,a);let y=x.getImageData(0,0,e,i);ut(y.data,e,i,a.bgRemovalEnabled,a.sigThreshold,a.sigInkColorMode??(a.sigHighContrast?"mono":"original"),24),x.putImageData(y,0,0),l.drawImage(m,0,0)}}else if(a.bgRemovalEnabled&&n&&n.sourceSrc===t.src){b=!0;let m=a.bgChokePx??0,x=a.bgFeather??0;if(m===0&&x===0)U(l,n.imageBitmap,n.width,n.height,e,i,a);else if(m===0&&x>0){let y=document.createElement("canvas");y.width=e,y.height=i;let h=y.getContext("2d");if(h){U(h,t,t.naturalWidth,t.naturalHeight,e,i,a);let f=h.getImageData(0,0,e,i),E=document.createElement("canvas");E.width=e,E.height=i;let M=E.getContext("2d");if(M){U(M,n.imageBitmap,n.width,n.height,e,i,a);let P=M.getImageData(0,0,e,i),g=e*i,I=new Uint8Array(g);for(let B=0;B<g;B++)I[B]=P.data[B*4+3];et(f.data,I,e,i,0,x),h.putImageData(f,0,0)}l.drawImage(y,0,0)}}else{let y=document.createElement("canvas");y.width=e,y.height=i;let h=y.getContext("2d");if(h){U(h,t,t.naturalWidth,t.naturalHeight,e,i,a);let f=h.getImageData(0,0,e,i),E=document.createElement("canvas");E.width=e,E.height=i;let M=E.getContext("2d");if(M){U(M,n.imageBitmap,n.width,n.height,e,i,a);let P=M.getImageData(0,0,e,i),g=e*i,I=new Uint8Array(g);for(let B=0;B<g;B++)I[B]=P.data[B*4+3];et(f.data,I,e,i,m,x),h.putImageData(f,0,0)}l.drawImage(y,0,0)}}}else U(l,t,t.naturalWidth,t.naturalHeight,e,i,a);let u=a.targetCapKb*1024,c="",v=a.qualityPct/100;if(a.format==="image/png")c=r.toDataURL("image/png");else{let m=.1,x=Math.min(.98,Math.max(.25,a.qualityPct/100));if(c=r.toDataURL(a.format,x),nt(c)>u)for(let h=0;h<7;h++){let f=(m+x)/2,E=r.toDataURL(a.format,f);nt(E)<=u?(c=E,v=f,m=f):x=f}}let s=nt(c),o=Math.max(.5,Number((s/1024).toFixed(1)));return{dataUrl:c,sizeBytes:s,sizeKb:o,outWidth:e,outHeight:i,qualityUsed:Math.round(v*100),hasSourceImage:!0,usedNeuralMatte:b}}function nt(a){let t=a.indexOf(",");if(t===-1)return 0;let n=a.length-(t+1);return Math.round(n*3/4)}var Bt="https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm",It="https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm",bt=new Function("moduleUrl","return import(moduleUrl)"),L=null,z=null,q=!1,st=new Set,J={status:"idle",progressPct:0,stageLabel:"ISNet Neural Matting Ready",detailText:"@imgly/background-removal@1.7.0 \u2022 100% On-Device",cachedInIndexedDB:!1,engineName:"ISNet Quint8 (@imgly/background-removal@1.7.0)",modelTier:"isnet_quint8"};function xt(a){return st.add(a),a(J),()=>st.delete(a)}function O(a){J={...J,...a};for(let t of st)t(J)}function it(a,t="isnet_quint8"){return!a||!L?null:L.sourceSrc===a.src&&L.modelTier===t?L:null}function ot(){if(L?.imageBitmap&&typeof L.imageBitmap.close=="function")try{L.imageBitmap.close()}catch{}L=null,z=null}async function kt(a){let t=Math.max(1,a.naturalWidth||a.width),n=Math.max(1,a.naturalHeight||a.height),e=document.createElement("canvas");e.width=t,e.height=n;let i=e.getContext("2d");return i&&i.drawImage(a,0,0,t,n),new Promise((d,r)=>{e.toBlob(l=>{l?d(l):r(new Error("Failed to encode image element to Blob"))},"image/png")})}async function Lt(a){if(typeof createImageBitmap=="function"){let n=await createImageBitmap(a),e=Math.max(1,n.width),i=Math.max(1,n.height),d=document.createElement("canvas");d.width=e,d.height=i;let r=d.getContext("2d");return r&&r.drawImage(n,0,0,e,i),{imageBitmap:n,maskCanvas:d,width:e,height:i}}let t=URL.createObjectURL(a);try{let n=await new Promise((l,p)=>{let b=new Image;b.onload=()=>l(b),b.onerror=u=>p(u),b.src=t}),e=Math.max(1,n.naturalWidth||n.width),i=Math.max(1,n.naturalHeight||n.height),d=document.createElement("canvas");d.width=e,d.height=i;let r=d.getContext("2d");return r&&r.drawImage(n,0,0,e,i),{imageBitmap:d,maskCanvas:d,width:e,height:i}}finally{URL.revokeObjectURL(t)}}async function Tt(){try{let n=await bt(Bt),e=n.removeBackground??n.default;if(typeof e=="function")return e}catch(n){console.warn("@imgly/background-removal@1.7.0 failed to import, trying @1.5.5 fallback:",n)}let a=await bt(It),t=a.removeBackground??a.default;if(typeof t!="function")throw new Error("removeBackground export not found in @imgly/background-removal");return t}async function ft(a,t,n="isnet_quint8",e){let i=a.src;if(!i)return null;let d=`${i}::${n}`;if(L&&L.sourceSrc===i&&L.modelTier===n)return O({status:"ready",progressPct:100,stageLabel:"Neural Cutout Cached (60fps)",detailText:`${L.engineName} \u2022 ImageBitmap in Memory`,cachedInIndexedDB:!0,modelTier:n}),e?.(L),L;if(z===d)return null;z=d;let r=n==="isnet_fp16"?"ISNet FP16 Studio Pro":"ISNet Quint8 Neural";O({status:"downloading",progressPct:5,stageLabel:`Loading ${r} (5%)`,detailText:"Importing @imgly/background-removal@1.7.0\u2026",cachedInIndexedDB:q,engineName:r,modelTier:n});try{let l=t??await kt(a),p=await Tt(),b=new Map,u=await p(l,{model:n,output:{format:"image/png",quality:1},progress:(s,o,m)=>{if(s.startsWith("fetch:")){b.set(s,{cur:Math.max(0,o),tot:Math.max(1,m)});let x=0,y=0;for(let P of b.values())x+=P.cur,y+=P.tot;let h=y>0?Math.min(1,x/y):.5,f=Math.max(6,Math.min(72,Math.round(6+h*66))),E=(x/(1024*1024)).toFixed(1),M=(y/(1024*1024)).toFixed(1);O({status:"downloading",progressPct:f,stageLabel:q?`Loading Neural Model: ${f}%`:`Downloading Neural Model: ${f}%`,detailText:y>1e4?`${E} / ${M} MB \u2022 ${r}`:`${r} (@imgly/background-removal@1.7.0)`,cachedInIndexedDB:q,modelTier:n})}else if(s.startsWith("compute:")){q=!0;let x=m>0?Math.min(1,o/m):.6,y=Math.max(74,Math.min(99,Math.round(74+x*25)));O({status:"inferring",progressPct:y,stageLabel:`Segmenting Portrait: ${y}%`,detailText:s==="compute:inference"?`Running ${r} neural segmentation\u2026`:"Decoding transparent PNG ImageBitmap\u2026",cachedInIndexedDB:!0,modelTier:n})}}});q=!0;let c=await Lt(u);if(L?.imageBitmap&&typeof L.imageBitmap.close=="function")try{L.imageBitmap.close()}catch{}let v={sourceSrc:i,modelTier:n,imageBitmap:c.imageBitmap,maskCanvas:c.maskCanvas,width:c.width,height:c.height,engineName:r};return L=v,z=null,O({status:"ready",progressPct:100,stageLabel:"Neural Cutout Ready (100%)",detailText:`${r} \u2022 ImageBitmap Cached (60fps)`,cachedInIndexedDB:!0,modelTier:n}),e?.(v),v}catch(l){return console.error("On-device neural background removal error:",l),z=null,O({status:"error",progressPct:0,stageLabel:"Neural Model Load Error \u2014 Click Retry",detailText:l instanceof Error?l.message:"Check network connection to load @imgly/background-removal@1.7.0",cachedInIndexedDB:!1,modelTier:n}),e?.(null),null}}var Ct={mode:"photo",presetId:"buet",widthPx:300,heightPx:350,unit:"px",dpi:300,aspectRatioLock:"6:7",rotationDeg:0,scalePct:100,offsetX:0,offsetY:0,flipH:!1,flipV:!1,bgTone:"white",customBgColor:"#dbeafe",bgRemovalEnabled:!0,bgTolerance:30,bgChokePx:0,bgFeather:0,sigHighContrast:!1,sigInkColorMode:"original",sigThreshold:14,format:"image/jpeg",formatExtLabel:"JPG",targetCapKb:75,qualityPct:90,resolutionTier:"standard",stripExif:!0,viewMode:"single",zoomPct:100,showGrid:!0,splitPositionPct:50,theme:"oled"},vt=["oled","warm","light","gray"];function St(a,t){if(!a)return;let n=document.createElement("a");n.href=a,n.download=t,document.body.appendChild(n),n.click(),document.body.removeChild(n)}var rt=class{constructor(){this.state={...Ct};this.rawImageEl=null;this.rawImageBlob=null;this.neuralModelTier="isnet_quint8";this.customUploadedFile=null;this.lastResult=null;this.exportHistory=[];this.toastTimer=null;this.renderDebounceTimer=null;this.isDraggingCanvas=!1;this.dragStart={x:0,y:0,offsetX:0,offsetY:0}}init(){this.applyThemeClass(this.state.theme),this.mountInitialShell(),xt(t=>{this.syncNeuralProgressUI(t)}),this.runPipelineAndSyncUI()}applyThemeClass(t){let n=document.documentElement;vt.forEach(e=>n.classList.remove(`theme-${e}`)),n.classList.add(`theme-${t}`),n.setAttribute("data-theme",t)}getAllPresetsList(){return ct.map(t=>R[t]).filter(Boolean)}getActivePreset(){return R[this.state.presetId]||R.buet}showToast(t){let n=document.getElementById("m3-toast-banner"),e=document.getElementById("m3-toast-text");n&&e&&(e.textContent=t,n.classList.remove("opacity-0","pointer-events-none","translate-y-4"),n.classList.add("opacity-100","translate-y-0")),this.toastTimer&&window.clearTimeout(this.toastTimer),this.toastTimer=window.setTimeout(()=>{let i=document.getElementById("m3-toast-banner");i&&(i.classList.add("opacity-0","pointer-events-none","translate-y-4"),i.classList.remove("opacity-100","translate-y-0"))},3e3)}triggerNeuralMattingIfNeeded(){if(!this.rawImageEl||this.state.mode!=="photo"||!this.state.bgRemovalEnabled)return;if(it(this.rawImageEl,this.neuralModelTier)){this.runPipelineAndSyncUI();return}ft(this.rawImageEl,this.rawImageBlob,this.neuralModelTier,()=>{this.runPipelineAndSyncUI()})}syncNeuralProgressUI(t){let n=document.getElementById("neural-stage-label"),e=document.getElementById("neural-stage-detail"),i=document.getElementById("neural-progress-bar"),d=document.getElementById("neural-idb-badge"),r=document.getElementById("canvas-neural-loading-pill"),l=document.getElementById("canvas-neural-loading-text");if(n&&(n.textContent=t.stageLabel),e&&(e.textContent=t.detailText),i){let p=t.status==="idle"||t.status==="ready"?100:Math.max(5,Math.min(100,t.progressPct));i.style.width=`${p}%`}if(d&&(d.textContent=t.status==="downloading"||t.status==="inferring"?`${t.progressPct}%`:t.status==="ready"?"60FPS BITMAP":t.status==="error"?"RETRY":"READY"),r&&l){let p=this.state.mode==="photo"&&this.state.bgRemovalEnabled&&!!this.rawImageEl&&(t.status==="downloading"||t.status==="inferring");r.classList.toggle("hidden",!p),r.classList.toggle("flex",p),p&&(l.textContent=`${t.stageLabel}`)}}schedulePipelineUpdate(t=!1){if(this.renderDebounceTimer&&window.clearTimeout(this.renderDebounceTimer),t){this.runPipelineAndSyncUI();return}this.renderDebounceTimer=window.setTimeout(()=>{this.runPipelineAndSyncUI()},16)}runPipelineAndSyncUI(){let t=this.state.mode==="photo"&&this.state.bgRemovalEnabled?it(this.rawImageEl,this.neuralModelTier):null,n=gt(this.state,this.rawImageEl,t);this.lastResult=n,this.syncDynamicDOM(n)}handleLocalFileUpload(t){if(!t.type.startsWith("image/")){this.showToast("Please select a valid image file (JPG, PNG, WebP, SVG).");return}this.customUploadedFile?.url&&URL.revokeObjectURL(this.customUploadedFile.url),ot(),this.rawImageBlob=t;let n=URL.createObjectURL(t),e=new Image;e.onload=()=>{this.customUploadedFile={name:t.name,sizeKb:Math.max(.5,Math.round(t.size/1024*10)/10),width:e.naturalWidth||600,height:e.naturalHeight||700,url:n},this.rawImageEl=e,this.runPipelineAndSyncUI(),this.triggerNeuralMattingIfNeeded(),this.showToast(`Loaded "${t.name}" (${this.customUploadedFile.width}\xD7${this.customUploadedFile.height} px) locally.`)},e.onerror=()=>{this.showToast("Could not decode that image file in browser.")},e.src=n}clearUploadedImage(){this.customUploadedFile?.url&&URL.revokeObjectURL(this.customUploadedFile.url),ot(),this.customUploadedFile=null,this.rawImageEl=null,this.rawImageBlob=null,this.runPipelineAndSyncUI(),this.showToast("Cleared image from browser memory.")}applyPreset(t){this.state.presetId=t.id,this.state.mode=t.mode,this.state.widthPx=t.widthPx,this.state.heightPx=t.heightPx,this.state.aspectRatioLock=t.ratioLabel,this.state.targetCapKb=t.maxKb,this.state.dpi=t.dpi,this.state.bgTone=t.defaultBg,this.state.scalePct=100,this.state.offsetX=0,this.state.offsetY=0,this.state.rotationDeg=0,this.schedulePipelineUpdate(!0),this.triggerNeuralMattingIfNeeded(),this.showToast(`Preset: ${t.shortName} (${t.widthPx}\xD7${t.heightPx} px \u2022 \u2264${t.maxKb} KB)`)}handleExportCurrentFile(){if(!this.rawImageEl){document.getElementById("local-file-input")?.click(),this.showToast("Select a photo or signature from your device first.");return}if((!this.lastResult||!this.lastResult.hasSourceImage)&&this.runPipelineAndSyncUI(),!this.lastResult||!this.lastResult.dataUrl)return;let t=this.getActivePreset(),n=this.state.formatExtLabel.toLowerCase(),e=this.state.resolutionTier==="low"?"_lowres":this.state.resolutionTier==="high"?"_highres_300dpi":"",d=`FormPhoto_${t.id.replace(/[^a-z0-9_-]/gi,"_")}_${this.lastResult.outWidth}x${this.lastResult.outHeight}${e}.${n}`;St(this.lastResult.dataUrl,d);let r={id:`${Date.now()}`,presetName:t.shortName,filename:d,width:this.lastResult.outWidth,height:this.lastResult.outHeight,sizeKb:this.lastResult.sizeKb,formatLabel:this.state.formatExtLabel,resolutionTier:this.state.resolutionTier,timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),dataUrl:this.lastResult.dataUrl};this.exportHistory.unshift(r),this.exportHistory.length>4&&this.exportHistory.pop(),this.renderExportHistoryStrip(),this.showToast(`Exported ${d} (${this.lastResult.sizeKb} KB) locally.`)}mountInitialShell(){let t=document.getElementById("root");if(!t)return;let n=this.getAllPresetsList();t.innerHTML=`
      <!-- Hidden Native File Input (100% On-Device Browser Processing) -->
      <input id="local-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/*" class="hidden" />

      <!-- COMPACT FULL-SCREEN TOP HEADER RIBBON -->
      <header class="w-full h-12 px-3 sm:px-5 border-b border-[var(--m3-outline-variant)] m3-surface-1 flex items-center justify-between gap-2 shrink-0 z-40">
        
        <!-- Left: Minimal Studio Icon & Title + On-Device Privacy Pill -->
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg m3-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[17px]">crop_free</span>
          </div>
          <span class="font-display font-bold text-sm tracking-tight text-m3-text">FormPhoto</span>
          <button id="btn-privacy-badge" type="button" class="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition" title="100% Native Browser Processing \u2014 Zero Server Upload">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="hidden sm:inline">On-Device Native</span>
          </button>
        </div>

        <!-- Center: Mode Switcher (Photo | Signature) + Upload Action -->
        <div class="flex items-center gap-1 bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)]">
          <button id="mode-btn-photo" type="button" class="m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">portrait</span>
            <span>Photo</span>
          </button>
          <button id="mode-btn-signature" type="button" class="m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">draw</span>
            <span>Signature</span>
          </button>
          <button id="btn-top-upload" type="button" class="m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold m3-secondary-container hover:opacity-90">
            <span class="material-symbols-outlined text-[14px]">upload_file</span>
            <span>Upload</span>
          </button>
        </div>

        <!-- Right: 4-Theme Switcher (OLED Pitch Black, Warm, Light, Gray) -->
        <div id="theme-switcher-bar" class="flex items-center bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] gap-0.5">
          ${vt.map(e=>{let i=dt[e];return`
              <button
                type="button"
                data-theme="${e}"
                class="theme-pill m3-spring flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                title="${i.name}: ${i.subtitle}"
              >
                <span class="material-symbols-outlined text-[14px]">${i.icon}</span>
                <span class="hidden xl:inline">${i.name}</span>
              </button>
            `}).join("")}
        </div>
      </header>

      <!-- MAIN WORKSPACE: Full-Screen Studio on Tablet & Large Monitors (md+) -->
      <main class="flex-1 w-full md:h-[calc(100vh-3rem)] md:overflow-hidden relative flex flex-col md:flex-row items-stretch">
        
        <!-- LEFT DOCKED CONTROL RAIL (Compact & Streamlined on Tablet/Desktop) -->
        <aside class="w-full md:w-[315px] lg:w-[335px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--m3-outline-variant)] m3-surface-1 p-3 sm:p-3.5 md:overflow-y-auto flex flex-col gap-3 z-20 order-2 md:order-1">
          
          <!-- 1. MINIMIZED ADMISSION PORTAL TRIGGER PILL (Opens Pop-up Modal) -->
          <div class="m3-surface rounded-2xl p-2.5 border border-[var(--m3-outline-variant)] flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">verified</span>
                <span class="text-[10px] font-mono uppercase tracking-wider m3-text-muted font-bold">Portal Preset</span>
              </div>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span id="minimized-portal-name" class="font-display font-bold text-xs truncate">BUET Engineering</span>
                <span id="minimized-portal-spec" class="font-mono text-[10px] px-1.5 py-0.5 rounded m3-primary-container font-bold shrink-0">300\xD7350 \u2022 \u226475KB</span>
              </div>
            </div>
            <button id="btn-open-portal-popup" type="button" class="m3-spring px-2.5 py-1.5 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-[11px] font-bold flex items-center gap-1 shrink-0">
              <span>Portals</span>
              <span class="material-symbols-outlined text-[15px]">open_in_new</span>
            </button>
          </div>

          <!-- 2. DIMENSIONS & ASPECT RATIO -->
          <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">straighten</span>
                <span>Dimensions</span>
              </span>
              <div id="unit-selector-group" class="flex bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] text-[10px] font-mono font-bold">
                <button type="button" data-unit="px" class="unit-btn px-2 py-0.5 rounded-full">px</button>
                <button type="button" data-unit="mm" class="unit-btn px-2 py-0.5 rounded-full">mm</button>
                <button type="button" data-unit="cm" class="unit-btn px-2 py-0.5 rounded-full">cm</button>
                <button type="button" data-unit="in" class="unit-btn px-2 py-0.5 rounded-full">in</button>
              </div>
            </div>

            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
              <div class="m3-surface-1 p-2 rounded-xl border border-[var(--m3-outline-variant)]">
                <div class="flex items-center justify-between">
                  <label for="input-dim-w" class="text-[9px] font-mono uppercase m3-text-muted">Width</label>
                  <span id="label-unit-w" class="text-[9px] font-mono text-m3-primary font-bold">px</span>
                </div>
                <input id="input-dim-w" type="number" step="any" min="1" max="4000" class="w-full bg-transparent font-mono font-bold text-sm focus:outline-none text-m3-text" value="300" />
              </div>

              <div class="flex flex-col items-center gap-1">
                <button id="btn-lock-aspect" type="button" class="m3-spring w-8 h-8 rounded-xl m3-primary-container flex items-center justify-center" title="Lock Aspect Ratio">
                  <span id="icon-lock-aspect" class="material-symbols-outlined text-[15px]">lock</span>
                </button>
                <button id="btn-swap-dims" type="button" class="text-[10px] m3-text-muted hover:text-m3-text" title="Swap Width & Height">\u21C4</button>
              </div>

              <div class="m3-surface-1 p-2 rounded-xl border border-[var(--m3-outline-variant)]">
                <div class="flex items-center justify-between">
                  <label for="input-dim-h" class="text-[9px] font-mono uppercase m3-text-muted">Height</label>
                  <span id="label-unit-h" class="text-[9px] font-mono text-m3-primary font-bold">px</span>
                </div>
                <input id="input-dim-h" type="number" step="any" min="1" max="4000" class="w-full bg-transparent font-mono font-bold text-sm focus:outline-none text-m3-text" value="350" />
              </div>
            </div>

            <!-- Aspect Ratio Chips + DPI -->
            <div class="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[var(--m3-outline-variant)]">
              <div id="aspect-ratio-group" class="flex flex-wrap gap-1">
                ${["6:7","1:1","2:3","7:9","300:80","Free"].map(e=>`
                  <button type="button" data-ratio="${e}" class="ratio-chip text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition">${e}</button>
                `).join("")}
              </div>
              <div class="flex gap-1">
                <button id="dpi-btn-300" type="button" class="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold">300 DPI</button>
                <button id="dpi-btn-72" type="button" class="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold">72 DPI</button>
              </div>
            </div>
          </div>

          <!-- 3. ON-DEVICE NEURAL BACKGROUND STUDIO & EDGE REFINEMENT -->
          <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">auto_fix_high</span>
                <span>Background Studio</span>
              </span>
              <button id="btn-toggle-bg-remove" type="button" class="m3-spring px-2.5 py-1 rounded-full m3-primary-container font-mono font-bold text-[10px]">
                <span id="bg-remove-status-text">ACTIVE</span>
              </button>
            </div>

            <!-- Studio Fill Swatches (#ffffff White, #38bdf8 Sky Blue, etc.) -->
            <div class="flex items-center justify-between">
              <span class="text-[11px] m3-text-muted font-medium">Backdrop Fill</span>
              <div class="flex items-center gap-1.5 bg-[var(--m3-surface-1)] p-1 rounded-full border border-[var(--m3-outline-variant)]">
                <button type="button" data-bgtone="white" class="bg-swatch w-5 h-5 rounded-full bg-white border border-stone-400 transition hover:scale-110" title="Pure White (#ffffff)"></button>
                <button type="button" data-bgtone="blue" class="bg-swatch w-5 h-5 rounded-full bg-[#38bdf8] border border-white transition hover:scale-110" title="Passport Sky Blue (#38bdf8)"></button>
                <button type="button" data-bgtone="grey" class="bg-swatch w-5 h-5 rounded-full bg-slate-200 border border-white transition hover:scale-110" title="Neutral Off-White (#e2e8f0)"></button>
                <button type="button" data-bgtone="alpha" class="bg-swatch w-5 h-5 rounded-full checker-bg border border-stone-400 transition hover:scale-110" title="Transparent Alpha (PNG/WebP)"></button>
                <label class="w-5 h-5 rounded-full overflow-hidden border border-stone-400 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500" title="Custom Backdrop Color">
                  <input id="input-custom-bg-color" type="color" value="#dbeafe" class="opacity-0 w-0 h-0" />
                </label>
              </div>
            </div>

            <!-- Portrait Neural AI Progress Bar & Alpha Matte Edge Refinement Sliders -->
            <div id="portrait-matting-controls" class="flex flex-col gap-2.5 pt-1.5 border-t border-[var(--m3-outline-variant)]">
              
              <!-- Two-Tier Commercial-Grade Neural Engine Selector -->
              <div class="grid grid-cols-2 gap-1 bg-[var(--m3-surface-1)] p-1 rounded-xl border border-[var(--m3-outline-variant)]">
                <button id="btn-neural-tier-quint8" type="button" class="m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition m3-primary shadow-sm" title="Default Engine: @imgly/background-removal@1.7.0 (isnet_quint8)">
                  ISNet Quint8 (Default)
                </button>
                <button id="btn-neural-tier-fp16" type="button" class="m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition m3-text-muted hover:text-m3-text" title="Studio Pro Tier: @imgly/background-removal@1.7.0 (isnet_fp16)">
                  ISNet FP16 (Studio Pro)
                </button>
              </div>

              <!-- Real-Time Neural Model Download / Processing Progress Box -->
              <div id="neural-progress-container" class="m3-surface-1 rounded-xl p-2 border border-[var(--m3-outline-variant)] cursor-pointer" title="Click to re-run neural segmentation">
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span id="neural-stage-label" class="text-[10px] font-mono font-bold text-m3-primary truncate">ISNet Neural Matting Ready</span>
                  <span id="neural-idb-badge" class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold shrink-0">READY</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[var(--m3-surface-2)] overflow-hidden">
                  <div id="neural-progress-bar" class="h-full m3-primary transition-all duration-200" style="width: 100%;"></div>
                </div>
                <span id="neural-stage-detail" class="text-[9px] font-mono m3-text-muted mt-1 block truncate">@imgly/background-removal@1.7.0 \u2022 100% On-Device</span>
              </div>

              <!-- Alpha Matte Edge Refinement Sliders: Edge Choke / Defringe (-2px to +2px) & Edge Feather (0px to 3px) -->
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-bg-choke" class="text-[10px] font-semibold m3-text-muted" title="Shrink (-2px) or expand (+2px) alpha edge & remove room halo">Edge Choke / Defringe</label>
                    <span id="val-bg-choke" class="font-mono text-[10px] font-bold">0 px</span>
                  </div>
                  <input id="slider-bg-choke" type="range" min="-2" max="2" step="0.5" value="0" class="m3-slider" />
                  <div class="flex justify-between text-[8px] font-mono m3-text-muted mt-0.5">
                    <span>-2px Halo</span>
                    <span>+2px</span>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-bg-feather" class="text-[10px] font-semibold m3-text-muted" title="Soften alpha boundary before compositing (0px to 3px)">Edge Feather</label>
                    <span id="val-bg-feather" class="font-mono text-[10px] font-bold">0 px</span>
                  </div>
                  <input id="slider-bg-feather" type="range" min="0" max="3" step="0.5" value="0" class="m3-slider" />
                  <div class="flex justify-between text-[8px] font-mono m3-text-muted mt-0.5">
                    <span>0px Sharp</span>
                    <span>3px Soft</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Signature Mode: O(N) Bradley-Roth Integral-Image Local Adaptive Thresholding (w = 24, t = 0.14) -->
            <div id="signature-matting-controls" class="hidden flex-col gap-2.5 pt-1.5 border-t border-[var(--m3-outline-variant)]">
              <div class="flex items-center justify-between text-[9px] font-mono m3-surface-1 px-2 py-1 rounded-lg border border-[var(--m3-outline-variant)]">
                <span class="text-m3-primary font-bold">Bradley-Roth Integral Image</span>
                <span class="m3-text-muted">O(N) \u2022 w=24</span>
              </div>

              <!-- Toggle: Preserve Original Blue/Black Ink Color vs. Pure Monochrome Black -->
              <div>
                <span class="text-[10px] font-semibold m3-text-muted block mb-1">Ink Color Output</span>
                <div class="grid grid-cols-2 gap-1 bg-[var(--m3-surface-1)] p-1 rounded-xl border border-[var(--m3-outline-variant)]">
                  <button id="btn-sig-ink-original" type="button" class="m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition">
                    Original Blue/Black
                  </button>
                  <button id="btn-sig-ink-mono" type="button" class="m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition">
                    Pure Mono Black
                  </button>
                </div>
              </div>

              <!-- Ink Thickness / Contrast Slider (Calibrated around t = 0.14) -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-sig-threshold" class="text-[10px] font-semibold m3-text-muted">Ink Thickness / Contrast</label>
                  <span id="val-sig-threshold" class="font-mono text-[10px] font-bold">t = 0.14</span>
                </div>
                <input id="slider-sig-threshold" type="range" min="6" max="26" step="1" value="14" class="m3-slider" />
                <div class="flex justify-between text-[8px] font-mono m3-text-muted mt-0.5">
                  <span>Bold Stroke</span>
                  <span>Clean Shadow</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. CROP, PAN, ROTATE & STRICT KB CAP SLIDERS -->
          <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">tune</span>
                <span>Crop &amp; KB Limit</span>
              </span>
              <button id="btn-reset-crop" type="button" class="text-[10px] font-mono font-semibold text-m3-primary hover:underline flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[13px]">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label for="slider-zoom" class="text-[11px] font-semibold">Zoom Scale</label>
                <span id="val-zoom" class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded m3-surface-2">100%</span>
              </div>
              <input id="slider-zoom" type="range" min="50" max="240" value="100" class="m3-slider" />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-pan-x" class="text-[10px] font-semibold m3-text-muted">Pan X</label>
                  <span id="val-pan-x" class="font-mono text-[10px] font-bold">0 px</span>
                </div>
                <input id="slider-pan-x" type="range" min="-120" max="120" value="0" class="m3-slider" />
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-pan-y" class="text-[10px] font-semibold m3-text-muted">Pan Y</label>
                  <span id="val-pan-y" class="font-mono text-[10px] font-bold">0 px</span>
                </div>
                <input id="slider-pan-y" type="range" min="-120" max="120" value="0" class="m3-slider" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-rotation" class="text-[10px] font-semibold m3-text-muted">Rotate</label>
                  <div class="flex items-center gap-1">
                    <button id="btn-rot-left" type="button" class="px-1 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">-90\xB0</button>
                    <span id="val-rotation" class="font-mono text-[10px] font-bold">0\xB0</span>
                    <button id="btn-rot-right" type="button" class="px-1 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">+90\xB0</button>
                  </div>
                </div>
                <input id="slider-rotation" type="range" min="-180" max="180" value="0" class="m3-slider" />
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-quality" class="text-[10px] font-semibold m3-text-muted">Quality</label>
                  <span id="val-quality" class="font-mono text-[10px] font-bold">90%</span>
                </div>
                <input id="slider-quality" type="range" min="35" max="98" value="90" class="m3-slider" />
              </div>
            </div>

            <div class="pt-1.5 border-t border-[var(--m3-outline-variant)]">
              <div class="flex justify-between items-center mb-1">
                <label for="slider-max-kb" class="text-[11px] font-semibold">Max File Size Cap</label>
                <span id="val-max-kb" class="font-mono text-[10px] font-bold px-2 py-0.5 rounded m3-tertiary-container">\u2264 75 KB</span>
              </div>
              <input id="slider-max-kb" type="range" min="15" max="200" step="5" value="75" class="m3-slider" />
            </div>
          </div>
        </aside>

        <!-- CENTER STAGE: Top Ribbon with Top-Right Export Corner + Centered Canvas Stage -->
        <section class="flex-1 relative flex flex-col items-center justify-between p-3 sm:p-5 studio-dot-grid overflow-hidden order-1 md:order-2 min-h-[480px]">
          
          <!-- TOP STAGE BAR: Left View Mode + Center Telemetry Pill + TOP-RIGHT EXPORT DOCK -->
          <div class="w-full flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 z-30 shrink-0">
            
            <!-- Left Group: View Mode Switcher + Minimized Spec Telemetry & Portal Validation Pill -->
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <div id="view-mode-group" class="flex items-center m3-surface-1 p-0.5 rounded-full border border-[var(--m3-outline-variant)] text-[11px] shadow-sm shrink-0">
                <button id="btn-view-single" type="button" data-view="single" class="view-mode-btn px-2.5 py-1 rounded-full font-bold transition">Output Only</button>
                <button id="btn-view-dual" type="button" data-view="dual" class="view-mode-btn px-2.5 py-1 rounded-full font-semibold transition">Side-by-Side</button>
                <button id="btn-view-split" type="button" data-view="split" class="view-mode-btn px-2.5 py-1 rounded-full font-semibold transition">Split Wipe</button>
              </div>

              <!-- MINIMIZED SPEC TELEMETRY & PORTAL VALIDATION PILL (Click to open details popup) -->
              <button id="btn-telemetry-pill" type="button" class="m3-spring flex items-center gap-1.5 px-2.5 py-1 rounded-full m3-surface-1 border border-[var(--m3-outline-variant)] shadow-sm text-[11px] font-mono hover:border-[var(--m3-primary)] shrink-0" title="Click to inspect full Spec Telemetry & Portal Validation Checks">
                <span id="pill-telemetry-dims" class="font-bold text-m3-text">300\xD7350 px</span>
                <span class="opacity-40">\u2022</span>
                <span id="pill-telemetry-kb" class="font-bold text-emerald-400">\u2264 75 KB</span>
                <span class="opacity-40">\u2022</span>
                <span id="pill-telemetry-ratio" class="m3-text-muted">6:7</span>
                <span class="opacity-40">\u2022</span>
                <span id="pill-telemetry-checks" class="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">PASS 5/5</span>
                <span class="material-symbols-outlined text-[13px] m3-text-muted">info</span>
              </button>
            </div>

            <!-- TOP-RIGHT CORNER EXPORT DOCK (Never overlaps the canvas in Side-by-Side or Output Only mode) -->
            <div class="flex items-center gap-1.5 m3-surface-1 p-1 rounded-2xl border border-[var(--m3-outline-variant)] shadow-lg ml-auto shrink-0">
              <!-- Format Pills (JPG | JPEG | PNG | WEBP) -->
              <div id="format-selector-group" class="flex items-center gap-0.5 bg-[var(--m3-surface-2)] p-0.5 rounded-xl border border-[var(--m3-outline-variant)]">
                ${[{mime:"image/jpeg",ext:"JPG"},{mime:"image/jpeg",ext:"JPEG"},{mime:"image/png",ext:"PNG"},{mime:"image/webp",ext:"WEBP"}].map(e=>`
                  <button type="button" data-format="${e.mime}" data-ext="${e.ext}" class="format-btn m3-spring px-1.5 py-1 rounded-lg font-mono text-[10px] font-bold text-center transition">
                    ${e.ext}
                  </button>
                `).join("")}
              </div>

              <!-- Resolution Tier Pills (Low | Std 1x | High 2x) -->
              <div id="resolution-tier-group" class="flex items-center gap-0.5 bg-[var(--m3-surface-2)] p-0.5 rounded-xl border border-[var(--m3-outline-variant)]">
                <button type="button" data-tier="low" class="tier-btn m3-spring py-1 px-1.5 rounded-lg text-[10px] font-bold text-center">Low 0.75\xD7</button>
                <button type="button" data-tier="standard" class="tier-btn m3-spring py-1 px-1.5 rounded-lg text-[10px] font-bold text-center">Std 1\xD7</button>
                <button type="button" data-tier="high" class="tier-btn m3-spring py-1 px-1.5 rounded-lg text-[10px] font-bold text-center">High 2\xD7</button>
              </div>

              <!-- Primary Export Button at Top-Right Corner -->
              <button id="btn-export-primary" type="button" class="m3-spring py-1.5 px-3 rounded-xl m3-primary font-display font-bold text-xs shadow-md flex items-center justify-center gap-1.5 hover:opacity-95 whitespace-nowrap">
                <span class="material-symbols-outlined text-[15px]">download</span>
                <span id="export-btn-text">Export 300\xD7350 JPG</span>
              </button>
            </div>
          </div>

          <!-- CENTER CANVAS STAGE (Dead-Center in Viewport, 100% Unobstructed) -->
          <div class="flex-1 w-full flex items-center justify-center my-2 relative">
            
            <!-- EMPTY STATE NATIVE UPLOAD DROPZONE (Shown when no photo is loaded yet \u2014 Zero Demo Photo) -->
            <div id="empty-upload-stage" class="w-full max-w-md m3-surface-1 rounded-[28px] p-6 sm:p-8 border-2 border-dashed border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] transition flex flex-col items-center text-center cursor-pointer shadow-xl">
              <div class="w-14 h-14 rounded-2xl m3-primary-container flex items-center justify-center mb-3 shadow-inner">
                <span class="material-symbols-outlined text-[30px]">add_photo_alternate</span>
              </div>
              <h2 class="font-display font-bold text-base sm:text-lg text-m3-text">Drop or Select Image from Device</h2>
              <p class="text-xs m3-text-muted mt-1 max-w-xs leading-relaxed">
                100% native browser processing. Neural portrait matting &amp; Bradley-Roth adaptive signature isolation run strictly on your device.
              </p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span class="px-4 py-2 rounded-full m3-primary font-display font-bold text-xs shadow flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Choose Local Image</span>
                </span>
              </div>
              <div class="mt-4 pt-3 border-t border-[var(--m3-outline-variant)] w-full flex items-center justify-center gap-3 text-[10px] font-mono m3-text-muted">
                <span id="empty-target-spec-hint">Target: BUET 300 \xD7 350 px \u2022 \u2264 75 KB \u2022 JPG</span>
              </div>
            </div>

            <!-- ACTIVE IMAGE WORKBENCH (Shown as soon as user uploads an image) -->
            <div id="workbench-stage-grid" class="hidden items-center justify-center gap-6 w-full max-w-4xl">
              
              <!-- RAW INPUT CARD (Only visible when user switches to Side-by-Side 'dual' mode) -->
              <div id="stage-raw-card" class="hidden m3-surface-1 rounded-3xl p-3.5 border border-[var(--m3-outline-variant)] flex-col items-center shadow-lg">
                <div class="w-full flex items-center justify-between mb-2 px-1 gap-3">
                  <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full m3-surface-2 font-bold">Raw Input</span>
                  <span id="raw-meta-badge" class="text-[10px] font-mono m3-text-muted font-bold"></span>
                </div>
                <div id="raw-dropzone" class="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[var(--m3-outline-variant)] cursor-pointer" style="width: 240px; height: 280px;" title="Click to replace image">
                  <img id="raw-preview-img" alt="Uploaded Raw Source" referrerpolicy="no-referrer" class="w-full h-full object-contain" />
                </div>
              </div>

              <!-- CONVERTED OUTPUT STAGE (Centered Hero Canvas) -->
              <div id="stage-output-card" class="m3-surface-1 rounded-3xl p-4 border border-[var(--m3-outline-variant)] flex flex-col items-center shadow-2xl relative">
                <div class="w-full flex items-center justify-between gap-4 mb-2.5 px-1">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span class="text-[10px] font-mono uppercase tracking-wider font-bold">Converted Output</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span id="out-dim-badge" class="text-[11px] font-mono font-bold text-m3-primary">300 \xD7 350 px</span>
                    <button id="btn-stage-replace" type="button" class="text-[10px] font-mono px-2 py-0.5 rounded-md m3-surface-2 hover:m3-surface-3 font-semibold" title="Replace Image">Replace</button>
                    <button id="btn-stage-clear" type="button" class="text-[10px] font-mono px-2 py-0.5 rounded-md m3-surface-2 hover:text-rose-400 font-semibold" title="Clear Image">Clear</button>
                  </div>
                </div>

                <!-- Calibrated Output Viewport -->
                <div id="output-viewport-box" class="relative rounded-2xl overflow-hidden flex items-center justify-center p-4 checker-bg select-none border border-[var(--m3-outline-variant)]">
                  <div id="calibrated-frame-wrap" class="relative shadow-2xl rounded-lg overflow-hidden border border-white/80 transition-all duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing" style="width: 240px; height: 280px;">
                    <img id="converted-preview-img" alt="Converted Admission Output" referrerpolicy="no-referrer" class="w-full h-full object-contain pointer-events-none select-none" />
                    
                    <!-- Split-Wipe Raw Comparison Overlay -->
                    <div id="split-wipe-overlay" class="hidden absolute inset-0 overflow-hidden pointer-events-none" style="width: 50%;">
                      <img id="split-wipe-raw-img" alt="Raw Split Comparison" referrerpolicy="no-referrer" class="h-full max-w-none object-cover" style="width: 240px; height: 280px;" />
                      <div class="absolute top-0 bottom-0 right-0 w-0.5 bg-sky-400 shadow"></div>
                    </div>

                    <!-- Biometric Alignment Guide Overlay -->
                    <div id="biometric-guide-overlay" class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40">
                      <div id="biometric-oval" class="w-[62%] h-[68%] border border-dashed border-sky-300 rounded-full"></div>
                      <div class="w-full border-t border-dashed border-sky-300/60 absolute top-[50%]"></div>
                      <div class="h-full border-l border-dashed border-sky-300/60 absolute left-[50%]"></div>
                    </div>

                    <!-- Live Neural Segmentation Progress Overlay Pill -->
                    <div id="canvas-neural-loading-pill" class="hidden absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-sky-400/40 items-center justify-center gap-2 pointer-events-none">
                      <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0"></span>
                      <span id="canvas-neural-loading-text" class="text-[10px] font-mono font-bold text-white truncate">Running Neural Matting\u2026</span>
                    </div>
                  </div>
                </div>

                <!-- Split Wipe Slider Row -->
                <div id="split-wipe-control-row" class="hidden w-full mt-2.5 px-1 items-center gap-2">
                  <span class="text-[10px] font-mono font-bold m3-text-muted">Wipe</span>
                  <input id="slider-split-wipe" type="range" min="5" max="95" value="50" class="m3-slider flex-1" />
                  <span id="val-split-wipe" class="text-[10px] font-mono font-bold">50%</span>
                </div>

                <!-- Bottom Canvas Quick Bar -->
                <div class="w-full mt-2.5 flex items-center justify-between text-[10px] font-mono px-1 gap-4">
                  <label class="flex items-center gap-1.5 m3-text-muted cursor-pointer select-none">
                    <input id="chk-biometric-grid" type="checkbox" checked class="accent-[var(--m3-primary)] rounded" />
                    <span>Alignment Grid</span>
                  </label>
                  <span id="canvas-live-pill" class="font-bold text-emerald-400">300\xD7350 px</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Helper Hint & Recent Local Exports Strip -->
          <div class="w-full flex flex-wrap items-center justify-between gap-2 z-10">
            <span id="stage-footer-hint" class="text-[11px] font-mono m3-text-muted px-3 py-1 rounded-full m3-surface-1 border border-[var(--m3-outline-variant)]">
              Drag directly on canvas to pan \u2022 100% On-Device Native Processing
            </span>
            <div id="export-history-container" class="hidden items-center gap-1.5">
              <div id="export-history-list" class="flex items-center gap-1.5"></div>
            </div>
          </div>
        </section>
      </main>

      <!-- POP-UP MODAL 1: Minimized Admission Portals & Ruleset Matrix -->
      <div id="modal-portals" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-3xl w-full rounded-[28px] p-5 border border-[var(--m3-outline-variant)] shadow-2xl max-h-[86vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-m3-primary">verified</span>
              <div>
                <h3 class="font-display font-bold text-base">Select Admission Portal Preset</h3>
                <p class="text-[11px] m3-text-muted">Calibrates exact dimensions, aspect ratio, background tone, and KB cap.</p>
              </div>
            </div>
            <button data-close-modal="portals" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center hover:m3-surface-3">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 pr-1 mt-3 space-y-4">
            <!-- Quick Portal Cards Grid inside Pop-up -->
            <div id="preset-chips-container" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5"></div>

            <!-- Compact Ruleset Reference Table inside Pop-up -->
            <div class="border-t border-[var(--m3-outline-variant)] pt-3">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="m3-surface-2 font-mono uppercase text-[10px]">
                    <th class="p-2.5 rounded-l-lg">Portal</th>
                    <th class="p-2.5">Dimensions</th>
                    <th class="p-2.5">Ratio</th>
                    <th class="p-2.5">Size Limit</th>
                    <th class="p-2.5">Signature Spec</th>
                    <th class="p-2.5 rounded-r-lg text-right">Select</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--m3-outline-variant)]">
                  ${n.map(e=>`
                    <tr class="hover:bg-[var(--m3-surface-2)] transition">
                      <td class="p-2.5 font-bold">${e.shortName}<span class="block text-[10px] font-normal m3-text-muted">${e.name}</span></td>
                      <td class="p-2.5 font-mono font-bold">${e.widthPx}\xD7${e.heightPx} px</td>
                      <td class="p-2.5 font-mono">${e.ratioLabel}</td>
                      <td class="p-2.5 font-mono text-emerald-400 font-semibold">\u2264 ${e.maxKb} KB</td>
                      <td class="p-2.5 font-mono text-[10px] m3-text-muted">${e.sigDims||"N/A"}</td>
                      <td class="p-2.5 text-right">
                        <button type="button" data-apply-preset="${e.id}" class="px-2.5 py-1 rounded-full m3-primary text-[11px] font-bold">Use</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 2: Minimized Spec Telemetry & Portal Validation Checks Inspector -->
      <div id="modal-telemetry" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-md w-full rounded-[28px] p-5 border border-[var(--m3-outline-variant)] shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-m3-primary">monitoring</span>
              <h3 class="font-display font-bold text-base">Spec Telemetry &amp; Validation</h3>
            </div>
            <button data-close-modal="telemetry" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2.5 my-3">
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Output Dimensions</span>
              <span id="spec-dimensions" class="font-mono font-bold text-sm mt-0.5 block">300 \xD7 350 px</span>
              <span id="spec-physical" class="text-[10px] font-mono m3-text-muted block">25.4 \xD7 29.6 mm</span>
            </div>
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Encoded Size</span>
              <span id="spec-filesize" class="font-mono font-bold text-sm text-emerald-400 mt-0.5 block">Ready</span>
              <span id="spec-cap-note" class="text-[10px] font-mono m3-text-muted block">Cap: \u2264 75.0 KB</span>
            </div>
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Aspect Ratio</span>
              <span id="spec-ratio" class="font-mono font-bold text-sm mt-0.5 block">6 : 7</span>
              <span id="spec-lock-label" class="text-[10px] font-mono m3-text-muted block">Locked</span>
            </div>
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Container</span>
              <span id="spec-format" class="font-mono font-bold text-sm mt-0.5 block">JPG (sRGB)</span>
              <span id="spec-quality" class="text-[10px] font-mono m3-text-muted block">Quality: 90%</span>
            </div>
          </div>

          <div class="mt-2">
            <h4 class="font-mono uppercase text-[10px] m3-text-muted font-bold mb-2">Portal Validation Checks</h4>
            <ul id="compliance-checklist-ul" class="space-y-1.5 text-xs"></ul>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 3: 100% On-Device Data Privacy Inspector -->
      <div id="modal-privacy" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-md w-full rounded-[28px] p-5 border border-[var(--m3-outline-variant)] shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-400">shield_lock</span>
              <h3 class="font-display font-bold text-base">100% On-Device Native Privacy</h3>
            </div>
            <button data-close-modal="privacy" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <p class="text-xs m3-text-muted my-3 leading-relaxed">
            All image decoding, neural portrait matting (@imgly/background-removal with IndexedDB weight caching), Edge Choke/Defringe &amp; Feather refinement, and O(N) Bradley-Roth Integral-Image signature isolation run strictly inside your browser memory. Zero files are ever uploaded to any server.
          </p>
          <div class="flex justify-end">
            <button data-close-modal="privacy" type="button" class="px-4 py-1.5 rounded-full m3-primary text-xs font-bold">Close</button>
          </div>
        </div>
      </div>

      <!-- Floating Toast Notification -->
      <div id="m3-toast-banner" class="fixed bottom-4 left-4 z-50 max-w-sm m3-primary px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold opacity-0 pointer-events-none translate-y-4 transition-all duration-200">
        <span class="material-symbols-outlined text-[16px]">verified</span>
        <span id="m3-toast-text">Ready</span>
      </div>
    `,this.renderPresetChips(),this.bindEvents()}renderPresetChips(){let t=document.getElementById("preset-chips-container");if(!t)return;let n=this.getAllPresetsList();t.innerHTML=n.map(e=>{let i=e.id===this.state.presetId;return`
        <button
          type="button"
          data-preset-id="${e.id}"
          class="preset-chip m3-spring text-left p-2.5 rounded-2xl border transition flex flex-col justify-between ${i?"m3-primary-container border-[var(--m3-primary)]":"m3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]"}"
        >
          <div class="flex items-center justify-between w-full">
            <span class="font-bold text-xs truncate">${e.shortName}</span>
            <span class="w-2 h-2 rounded-full ${i?"bg-[var(--m3-primary)]":"bg-emerald-400/70"} shrink-0"></span>
          </div>
          <div class="font-mono text-[11px] font-semibold mt-1">${e.widthPx}\xD7${e.heightPx} px</div>
          <div class="text-[10px] opacity-75 truncate">\u2264 ${e.maxKb} KB \u2022 ${e.bgLabel}</div>
        </button>
      `}).join(""),t.querySelectorAll(".preset-chip").forEach(e=>{e.addEventListener("click",()=>{let i=e.dataset.presetId;i&&R[i]&&(this.applyPreset(R[i]),document.getElementById("modal-portals")?.classList.add("hidden"))})})}renderExportHistoryStrip(){let t=document.getElementById("export-history-container"),n=document.getElementById("export-history-list");if(!(!t||!n)){if(this.exportHistory.length===0){t.classList.add("hidden"),t.classList.remove("flex");return}t.classList.remove("hidden"),t.classList.add("flex"),n.innerHTML=this.exportHistory.slice(0,2).map(e=>`
        <a href="${e.dataUrl}" download="${e.filename}" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full m3-surface-1 border border-[var(--m3-outline-variant)] text-[10px] hover:border-[var(--m3-primary)] transition">
          <img src="${e.dataUrl}" alt="${e.filename}" referrerpolicy="no-referrer" class="w-4 h-4 rounded object-cover shrink-0" />
          <span class="font-mono font-bold truncate">${e.width}\xD7${e.height} (${e.sizeKb}KB)</span>
        </a>
      `).join("")}}bindEvents(){let t=document.getElementById("local-file-input"),n=()=>{t?.click()};document.getElementById("btn-top-upload")?.addEventListener("click",n),document.getElementById("empty-upload-stage")?.addEventListener("click",n),document.getElementById("btn-stage-replace")?.addEventListener("click",n),document.getElementById("raw-dropzone")?.addEventListener("click",n),document.getElementById("btn-stage-clear")?.addEventListener("click",()=>{this.clearUploadedImage()}),[document.getElementById("empty-upload-stage"),document.getElementById("stage-output-card")].forEach(s=>{s?.addEventListener("dragover",o=>{o.preventDefault(),s.classList.add("ring-2","ring-[var(--m3-primary)]")}),s?.addEventListener("dragleave",()=>{s.classList.remove("ring-2","ring-[var(--m3-primary)]")}),s?.addEventListener("drop",o=>{o.preventDefault(),s.classList.remove("ring-2","ring-[var(--m3-primary)]");let m=o.dataTransfer?.files?.[0];m&&this.handleLocalFileUpload(m)})}),t?.addEventListener("change",()=>{let s=t.files?.[0];s&&(this.handleLocalFileUpload(s),t.value="")}),document.getElementById("mode-btn-photo")?.addEventListener("click",()=>{this.applyPreset(R.buet)}),document.getElementById("mode-btn-signature")?.addEventListener("click",()=>{this.applyPreset(R.buet_sig)}),document.querySelectorAll("#theme-switcher-bar .theme-pill").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.theme;o&&(this.state.theme=o,this.applyThemeClass(o),this.syncThemeButtons())})}),document.getElementById("btn-open-portal-popup")?.addEventListener("click",()=>{document.getElementById("modal-portals")?.classList.remove("hidden")}),document.getElementById("btn-telemetry-pill")?.addEventListener("click",()=>{document.getElementById("modal-telemetry")?.classList.remove("hidden")}),document.getElementById("btn-privacy-badge")?.addEventListener("click",()=>{document.getElementById("modal-privacy")?.classList.remove("hidden")}),document.querySelectorAll("[data-close-modal]").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.closeModal;o&&document.getElementById(`modal-${o}`)?.classList.add("hidden")})}),document.querySelectorAll("[data-apply-preset]").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.applyPreset;o&&R[o]&&(this.applyPreset(R[o]),document.getElementById("modal-portals")?.classList.add("hidden"))})}),document.querySelectorAll("#unit-selector-group .unit-btn").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.unit;o&&(this.state.unit=o,this.syncDimensionInputsFromPx(),this.lastResult&&this.syncDynamicDOM(this.lastResult))})});let i=document.getElementById("input-dim-w"),d=document.getElementById("input-dim-h");i?.addEventListener("input",()=>{let s=parseFloat(i.value);if(!Number.isFinite(s)||s<=0)return;let o=at(s,this.state.unit,this.state.dpi),m=X("w",o,this.state.aspectRatioLock,this.state.widthPx,this.state.heightPx);this.state.widthPx=m.widthPx,this.state.heightPx=m.heightPx,this.state.aspectRatioLock!=="Free"&&this.syncDimensionInputsFromPx("width"),this.schedulePipelineUpdate()}),d?.addEventListener("input",()=>{let s=parseFloat(d.value);if(!Number.isFinite(s)||s<=0)return;let o=at(s,this.state.unit,this.state.dpi),m=X("h",o,this.state.aspectRatioLock,this.state.widthPx,this.state.heightPx);this.state.widthPx=m.widthPx,this.state.heightPx=m.heightPx,this.state.aspectRatioLock!=="Free"&&this.syncDimensionInputsFromPx("height"),this.schedulePipelineUpdate()}),document.getElementById("btn-lock-aspect")?.addEventListener("click",()=>{if(this.state.aspectRatioLock==="Free"){let s=Y(this.state.widthPx,this.state.heightPx);this.state.aspectRatioLock=s.ratioText}else this.state.aspectRatioLock="Free";this.schedulePipelineUpdate(!0)}),document.getElementById("btn-swap-dims")?.addEventListener("click",()=>{let s=this.state.widthPx;this.state.widthPx=this.state.heightPx,this.state.heightPx=s;let o=Y(this.state.widthPx,this.state.heightPx);this.state.aspectRatioLock=o.ratioText,this.syncDimensionInputsFromPx(),this.schedulePipelineUpdate(!0)}),document.querySelectorAll("#aspect-ratio-group .ratio-chip").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.ratio||"Free";if(this.state.aspectRatioLock=o,o!=="Free"){let m=X("w",this.state.widthPx,o,this.state.widthPx,this.state.heightPx);this.state.widthPx=m.widthPx,this.state.heightPx=m.heightPx,this.syncDimensionInputsFromPx()}this.schedulePipelineUpdate(!0)})}),document.getElementById("dpi-btn-300")?.addEventListener("click",()=>{this.state.dpi=300,this.syncDimensionInputsFromPx(),this.schedulePipelineUpdate(!0)}),document.getElementById("dpi-btn-72")?.addEventListener("click",()=>{this.state.dpi=72,this.syncDimensionInputsFromPx(),this.schedulePipelineUpdate(!0)}),document.querySelectorAll("#resolution-tier-group .tier-btn").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.tier;o&&(this.state.resolutionTier=o,this.schedulePipelineUpdate(!0))})});let r=(s,o)=>{let m=document.getElementById(s);m?.addEventListener("input",()=>{o(parseFloat(m.value)),this.schedulePipelineUpdate()})};r("slider-zoom",s=>{this.state.scalePct=s}),r("slider-pan-x",s=>{this.state.offsetX=s}),r("slider-pan-y",s=>{this.state.offsetY=s}),r("slider-rotation",s=>{this.state.rotationDeg=s}),r("slider-quality",s=>{this.state.qualityPct=s}),r("slider-max-kb",s=>{this.state.targetCapKb=s}),r("slider-bg-choke",s=>{this.state.bgChokePx=s}),r("slider-bg-feather",s=>{this.state.bgFeather=s}),r("slider-sig-threshold",s=>{this.state.sigThreshold=s});let l=s=>{this.neuralModelTier=s,this.syncNeuralTierButtons(),this.triggerNeuralMattingIfNeeded(),this.schedulePipelineUpdate(!0)};document.getElementById("btn-neural-tier-quint8")?.addEventListener("click",()=>l("isnet_quint8")),document.getElementById("btn-neural-tier-fp16")?.addEventListener("click",()=>l("isnet_fp16")),document.getElementById("neural-progress-container")?.addEventListener("click",()=>{this.triggerNeuralMattingIfNeeded()});let p=s=>{this.state.sigInkColorMode=s,this.state.sigHighContrast=s==="mono",this.schedulePipelineUpdate(!0)};document.getElementById("btn-sig-ink-original")?.addEventListener("click",()=>p("original")),document.getElementById("btn-sig-ink-mono")?.addEventListener("click",()=>p("mono")),document.getElementById("btn-rot-left")?.addEventListener("click",()=>{this.state.rotationDeg=(this.state.rotationDeg-90+540)%360-180,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-rot-right")?.addEventListener("click",()=>{this.state.rotationDeg=(this.state.rotationDeg+90+540)%360-180,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-reset-crop")?.addEventListener("click",()=>{this.state.scalePct=100,this.state.offsetX=0,this.state.offsetY=0,this.state.rotationDeg=0,this.state.qualityPct=90,this.state.bgChokePx=0,this.state.bgFeather=0,this.schedulePipelineUpdate(!0),this.showToast("Reset crop and edge parameters.")}),document.querySelectorAll("#format-selector-group .format-btn").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.format,m=s.dataset.ext;o&&m&&(this.state.format=o,this.state.formatExtLabel=m,this.schedulePipelineUpdate(!0))})}),document.querySelectorAll("#view-mode-group .view-mode-btn").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.view;o&&(this.state.viewMode=o,this.syncViewModeLayout())})});let b=document.getElementById("slider-split-wipe");b?.addEventListener("input",()=>{this.state.splitPositionPct=parseFloat(b.value),this.syncViewModeLayout()});let u=document.getElementById("calibrated-frame-wrap");u?.addEventListener("pointerdown",s=>{this.isDraggingCanvas=!0,this.dragStart={x:s.clientX,y:s.clientY,offsetX:this.state.offsetX,offsetY:this.state.offsetY},u.setPointerCapture(s.pointerId)}),u?.addEventListener("pointermove",s=>{if(!this.isDraggingCanvas)return;let o=s.clientX-this.dragStart.x,m=s.clientY-this.dragStart.y;this.state.offsetX=Math.max(-120,Math.min(120,Math.round(this.dragStart.offsetX+o*.6))),this.state.offsetY=Math.max(-120,Math.min(120,Math.round(this.dragStart.offsetY+m*.6))),this.schedulePipelineUpdate()}),u?.addEventListener("pointerup",()=>{this.isDraggingCanvas=!1}),document.getElementById("btn-toggle-bg-remove")?.addEventListener("click",()=>{this.state.bgRemovalEnabled=!this.state.bgRemovalEnabled,this.schedulePipelineUpdate(!0),this.triggerNeuralMattingIfNeeded()});let c=document.getElementById("chk-biometric-grid");c?.addEventListener("change",()=>{this.state.showGrid=c.checked;let s=document.getElementById("biometric-guide-overlay");s&&s.classList.toggle("hidden",!c.checked)}),document.querySelectorAll(".bg-swatch").forEach(s=>{s.addEventListener("click",()=>{let o=s.dataset.bgtone;o&&(this.state.bgTone=o,this.state.bgRemovalEnabled=!0,o==="alpha"&&this.state.format==="image/jpeg"&&(this.state.format="image/png",this.state.formatExtLabel="PNG",this.showToast("Switched to PNG to preserve transparent alpha cutout.")),this.schedulePipelineUpdate(!0),this.triggerNeuralMattingIfNeeded())})});let v=document.getElementById("input-custom-bg-color");v?.addEventListener("input",()=>{this.state.customBgColor=v.value,this.state.bgTone="custom",this.state.bgRemovalEnabled=!0,this.schedulePipelineUpdate(),this.triggerNeuralMattingIfNeeded()}),document.getElementById("btn-export-primary")?.addEventListener("click",()=>{this.handleExportCurrentFile()})}syncDimensionInputsFromPx(t){let n=document.getElementById("input-dim-w"),e=document.getElementById("input-dim-h"),i=document.getElementById("label-unit-w"),d=document.getElementById("label-unit-h");i&&(i.textContent=this.state.unit),d&&(d.textContent=this.state.unit),n&&t!=="width"&&(n.value=String(W(this.state.widthPx,this.state.unit,this.state.dpi))),e&&t!=="height"&&(e.value=String(W(this.state.heightPx,this.state.unit,this.state.dpi)))}syncThemeButtons(){document.querySelectorAll("#theme-switcher-bar .theme-pill").forEach(t=>{let n=t.dataset.theme===this.state.theme;t.className=`theme-pill m3-spring flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${n?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`})}syncViewModeLayout(){let t=document.getElementById("stage-raw-card"),n=document.getElementById("split-wipe-overlay"),e=document.getElementById("split-wipe-control-row"),i=document.getElementById("val-split-wipe");document.querySelectorAll("#view-mode-group .view-mode-btn").forEach(d=>{let r=d.dataset.view===this.state.viewMode;d.className=`view-mode-btn px-3 py-1 rounded-full transition ${r?"m3-primary font-bold shadow-sm":"m3-text-muted font-semibold hover:text-m3-text"}`}),!(!t||!n||!e)&&(this.state.viewMode==="dual"?(t.classList.remove("hidden"),t.classList.add("flex"),n.classList.add("hidden"),e.classList.add("hidden"),e.classList.remove("flex")):this.state.viewMode==="single"?(t.classList.add("hidden"),t.classList.remove("flex"),n.classList.add("hidden"),e.classList.add("hidden"),e.classList.remove("flex")):(t.classList.add("hidden"),t.classList.remove("flex"),n.classList.remove("hidden"),n.style.width=`${this.state.splitPositionPct}%`,e.classList.remove("hidden"),e.classList.add("flex"),i&&(i.textContent=`${this.state.splitPositionPct}%`)))}syncNeuralTierButtons(){let t=document.getElementById("btn-neural-tier-quint8"),n=document.getElementById("btn-neural-tier-fp16");if(t&&n){let e=this.neuralModelTier==="isnet_quint8";t.className=`m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${e?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`,n.className=`m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${e?"m3-text-muted hover:text-m3-text":"m3-primary shadow-sm"}`}}syncDynamicDOM(t){let n=this.getActivePreset();this.renderPresetChips(),this.syncThemeButtons(),this.syncNeuralTierButtons(),this.syncDimensionInputsFromPx(),this.syncViewModeLayout();let e=document.getElementById("empty-upload-stage"),i=document.getElementById("workbench-stage-grid");e&&i&&(t.hasSourceImage?(e.classList.add("hidden"),i.classList.remove("hidden"),i.classList.add("flex")):(e.classList.remove("hidden"),i.classList.add("hidden"),i.classList.remove("flex")));let d=document.getElementById("mode-btn-photo"),r=document.getElementById("mode-btn-signature");d&&r&&(d.className=`m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${this.state.mode==="photo"?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`,r.className=`m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${this.state.mode==="signature"?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`);let l=(w,k)=>{let A=document.getElementById(w);A&&(A.textContent=k)};l("minimized-portal-name",n.name),l("minimized-portal-spec",`${n.widthPx}\xD7${n.heightPx} \u2022 \u2264${n.maxKb}KB`),l("empty-target-spec-hint",`Target: ${n.shortName} ${t.outWidth} \xD7 ${t.outHeight} px \u2022 \u2264 ${this.state.targetCapKb} KB \u2022 ${this.state.formatExtLabel}`),document.querySelectorAll("#unit-selector-group .unit-btn").forEach(w=>{let k=w.dataset.unit===this.state.unit;w.className=`unit-btn px-2 py-0.5 rounded-full transition ${k?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`});let p=this.state.aspectRatioLock!=="Free",b=document.getElementById("btn-lock-aspect"),u=document.getElementById("icon-lock-aspect");b&&u&&(b.className=`m3-spring w-8 h-8 rounded-xl flex items-center justify-center ${p?"m3-primary-container":"m3-surface-2"}`,u.textContent=p?"lock":"lock_open"),document.querySelectorAll("#aspect-ratio-group .ratio-chip").forEach(w=>{let k=w.dataset.ratio===this.state.aspectRatioLock;w.className=`ratio-chip text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition ${k?"m3-primary font-bold":"m3-surface-2 hover:m3-surface-3"}`});let c=document.getElementById("dpi-btn-300"),v=document.getElementById("dpi-btn-72");c&&v&&(c.className=`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold transition ${this.state.dpi===300?"m3-secondary-container":"m3-surface-2 m3-text-muted"}`,v.className=`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold transition ${this.state.dpi===72?"m3-secondary-container":"m3-surface-2 m3-text-muted"}`),document.querySelectorAll("#resolution-tier-group .tier-btn").forEach(w=>{let k=w.dataset.tier===this.state.resolutionTier;w.className=`tier-btn m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center ${k?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`});let s=(w,k,A,C)=>{let N=document.getElementById(w),$=document.getElementById(k);N&&document.activeElement!==N&&(N.value=String(A)),$&&($.textContent=C)};s("slider-zoom","val-zoom",this.state.scalePct,`${this.state.scalePct}%`),s("slider-pan-x","val-pan-x",this.state.offsetX,`${this.state.offsetX>0?"+":""}${this.state.offsetX} px`),s("slider-pan-y","val-pan-y",this.state.offsetY,`${this.state.offsetY>0?"+":""}${this.state.offsetY} px`),s("slider-rotation","val-rotation",this.state.rotationDeg,`${this.state.rotationDeg}\xB0`),s("slider-quality","val-quality",this.state.qualityPct,`${this.state.qualityPct}%`),s("slider-max-kb","val-max-kb",this.state.targetCapKb,`\u2264 ${this.state.targetCapKb} KB`);let o=this.state.bgChokePx>0?"+":"";s("slider-bg-choke","val-bg-choke",this.state.bgChokePx,`${o}${this.state.bgChokePx} px`),s("slider-bg-feather","val-bg-feather",this.state.bgFeather,`${this.state.bgFeather} px`);let m=(this.state.sigThreshold/100).toFixed(2);s("slider-sig-threshold","val-sig-threshold",this.state.sigThreshold,`t = ${m}`);let x=document.getElementById("btn-sig-ink-original"),y=document.getElementById("btn-sig-ink-mono");if(x&&y){let w=this.state.sigInkColorMode!=="mono";x.className=`m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${w?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`,y.className=`m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${w?"m3-text-muted hover:text-m3-text":"m3-primary shadow-sm"}`}document.querySelectorAll("#format-selector-group .format-btn").forEach(w=>{let k=w.dataset.ext===this.state.formatExtLabel;w.className=`format-btn m3-spring px-2 py-1 rounded-lg font-mono text-[10px] font-bold text-center transition ${k?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`});let h=document.getElementById("raw-preview-img"),f=document.getElementById("split-wipe-raw-img"),E=document.getElementById("converted-preview-img"),M=document.getElementById("calibrated-frame-wrap"),P=document.getElementById("biometric-oval");if(this.rawImageEl&&h&&(h.src!==this.rawImageEl.src&&(h.src=this.rawImageEl.src),f&&f.src!==this.rawImageEl.src&&(f.src=this.rawImageEl.src)),this.customUploadedFile&&l("raw-meta-badge",`${this.customUploadedFile.width}\xD7${this.customUploadedFile.height} \u2022 ${this.customUploadedFile.sizeKb} KB`),E&&t.dataUrl&&(E.src=t.dataUrl),M){let w=t.outWidth/Math.max(1,t.outHeight),k=this.state.viewMode==="dual"?250:340,A=290,C=A*w,N=A;C>k&&(C=k,N=Math.max(72,C/w)),M.style.width=`${Math.round(C)}px`,M.style.height=`${Math.round(N)}px`,f&&(f.style.width=`${Math.round(C)}px`,f.style.height=`${Math.round(N)}px`);let $=this.state.bgTone==="custom"?this.state.customBgColor:V[this.state.bgTone];M.style.backgroundColor=this.state.bgRemovalEnabled&&this.state.bgTone!=="alpha"?$:"transparent"}let g=this.state.mode==="signature"||t.outWidth/t.outHeight>1.8;P&&(P.className=g?"w-[84%] h-[54%] border border-dashed border-sky-400/70 rounded-lg":"w-[62%] h-[68%] border border-dashed border-sky-300 rounded-full");let I=document.getElementById("bg-remove-status-text"),B=document.getElementById("btn-toggle-bg-remove"),T=document.getElementById("portrait-matting-controls"),D=document.getElementById("signature-matting-controls");if(I&&(I.textContent=this.state.bgRemovalEnabled?"ACTIVE":"OFF"),B&&(B.className=`m3-spring px-2.5 py-1 rounded-full font-mono font-bold text-[10px] ${this.state.bgRemovalEnabled?"m3-primary-container":"m3-surface-2 m3-text-muted"}`),T&&D&&(T.classList.toggle("hidden",g),T.classList.toggle("flex",!g),D.classList.toggle("hidden",!g),D.classList.toggle("flex",g)),g||!this.state.bgRemovalEnabled){let w=document.getElementById("canvas-neural-loading-pill");w&&(w.classList.add("hidden"),w.classList.remove("flex"))}document.querySelectorAll(".bg-swatch").forEach(w=>{let k=w.dataset.bgtone===this.state.bgTone;w.classList.toggle("ring-2",k),w.classList.toggle("ring-[var(--m3-primary)]",k)});let Q=W(t.outWidth,"mm",this.state.dpi),H=W(t.outHeight,"mm",this.state.dpi),_=Y(t.outWidth,t.outHeight),K=this.state.formatExtLabel,j=t.hasSourceImage?`${t.sizeKb} / ${this.state.targetCapKb} KB`:`\u2264 ${this.state.targetCapKb} KB`;l("out-dim-badge",`${t.outWidth} \xD7 ${t.outHeight} px`),l("canvas-live-pill",t.hasSourceImage?`${t.outWidth}\xD7${t.outHeight} px \u2022 ${t.sizeKb} KB`:`${t.outWidth}\xD7${t.outHeight} px`),l("pill-telemetry-dims",`${t.outWidth}\xD7${t.outHeight} px`),l("pill-telemetry-kb",j),l("pill-telemetry-ratio",_.ratioText),l("spec-dimensions",`${t.outWidth} \xD7 ${t.outHeight} px`),l("spec-physical",`${Q} \xD7 ${H} mm`),l("spec-filesize",t.hasSourceImage?`${t.sizeKb} KB`:"Awaiting Upload"),l("spec-cap-note",`Cap: \u2264 ${this.state.targetCapKb.toFixed(1)} KB`),l("spec-ratio",_.ratioText.replace(":"," : ")),l("spec-lock-label",this.state.aspectRatioLock!=="Free"?"Locked Proportional":"Free Custom Ratio"),l("spec-format",`${K} (sRGB)`),l("spec-quality",`Quality: ${t.qualityUsed}%`);let G=ht(this.state,t.hasSourceImage?t.sizeKb:this.state.targetCapKb*.7,n);l("pill-telemetry-checks",`PASS ${G.passedCount}/${G.totalCount}`);let S=document.getElementById("compliance-checklist-ul");S&&(S.innerHTML=G.checks.map(w=>`
          <li class="flex items-center justify-between p-2 rounded-xl m3-surface-2 gap-2">
            <span class="flex items-center gap-2 font-medium text-[11px] leading-tight">
              <span class="material-symbols-outlined ${w.passed?"text-emerald-400":"text-amber-400"} text-[15px] shrink-0">${w.passed?"check_circle":"info"}</span>
              <span>${w.label}</span>
            </span>
          </li>
        `).join("")),l("export-btn-text",t.hasSourceImage?`Export ${t.outWidth}\xD7${t.outHeight} ${K} (${t.sizeKb} KB)`:`Export ${t.outWidth}\xD7${t.outHeight} ${K}`)}};function yt(){if(window.__FORMPHOTO_MOUNTED__)return;window.__FORMPHOTO_MOUNTED__=!0,new rt().init()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",yt):yt();
