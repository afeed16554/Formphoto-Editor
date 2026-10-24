var se={blue:"#38bdf8",white:"#ffffff",grey:"#e2e8f0",black:"#000000",midgrey:"#808080",alpha:"transparent",custom:"#dbeafe"},xe={oled:{name:"OLED Black",subtitle:"Pitch #000000 black interface",icon:"contrast",isDark:!0,previewBg:"#000000",previewBorder:"#262626",previewText:"#38bdf8"},warm:{name:"Warm Reading",subtitle:"Amber cream paper & eye-comfort",icon:"menu_book",isDark:!1,previewBg:"#eee5db",previewBorder:"#d4c5b3",previewText:"#8b5000"},light:{name:"Light Tone",subtitle:"Crisp clean surfaces & cobalt blue",icon:"light_mode",isDark:!1,previewBg:"#f1f3fa",previewBorder:"#c4c6d4",previewText:"#1b5edb"},gray:{name:"Gray Balanced",subtitle:"Neutral slate studio contrast",icon:"tonality",isDark:!0,previewBg:"#2b2e36",previewBorder:"#434853",previewText:"#90d3e2"}},W={buet:{id:"buet",name:"BUET Engineering",shortName:"BUET",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:350,minKb:10,maxKb:75,ratioLabel:"6:7",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"engineering",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 20 KB",note:"300\xD7350 px, \u226475 KB, JPG/JPEG format with plain white background."},dgme:{id:"dgme",name:"Medical & Dental (DGME)",shortName:"DGME",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:300,minKb:10,maxKb:100,ratioLabel:"1:1",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"medical_services",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 60 KB",note:"DGME Teletalk, AFMC, Nursing (BNMC), & BUTEX: 300\xD7300 px, \u2264100 KB."},du:{id:"du",name:"Varsity: DU (Dhaka Univ)",shortName:"DU",category:"Bangladesh",mode:"photo",widthPx:360,heightPx:540,minKb:30,maxKb:200,ratioLabel:"2:3",defaultBg:"white",bgLabel:"Plain BG",dpi:300,icon:"school",sigDims:"Not required online",sigMaxKb:"N/A",note:"Dhaka University (DU): 360\xD7540 px, 30\u2013200 KB limit, both ears visible."},gst:{id:"gst",name:"Varsity: GST Cluster",shortName:"GST",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:300,minKb:10,maxKb:100,ratioLabel:"1:1",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"hub",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 60 KB",note:"GST Cluster & Agri Cluster: 300\xD7300 px, max 100 KB on plain background."},ckruet:{id:"ckruet",name:"CKRUET Engineering",shortName:"CKRUET",category:"Bangladesh",mode:"photo",widthPx:300,heightPx:350,minKb:10,maxKb:75,ratioLabel:"6:7",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"architecture",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 20 KB",note:"CUET, KUET, RUET unified admission: 300\xD7350 px photo (\u226475 KB)."},buet_sig:{id:"buet_sig",name:"BUET/DGME Signature",shortName:"Signature",category:"Signature",mode:"signature",widthPx:300,heightPx:80,minKb:3,maxKb:20,ratioLabel:"300:80",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"draw",sigDims:"300 \xD7 80 px",sigMaxKb:"Max 20 KB (BUET) / 60 KB (DGME)",note:"Official Admission Signature: 300\xD780 px, \u226420 KB (BUET) or \u226460 KB (DGME)."},bsmmu:{id:"bsmmu",name:"Postgrad BSMMU",shortName:"BSMMU",category:"Bangladesh",mode:"photo",widthPx:500,heightPx:500,minKb:10,maxKb:150,ratioLabel:"1:1",defaultBg:"white",bgLabel:"White BG",dpi:300,icon:"local_hospital",sigDims:"300 \xD7 200 px",sigMaxKb:"10\u2013100 KB",note:"BSMMU Postgraduate Medical: 500\xD7500 px photo (10\u2013150 KB)."},neet_jee:{id:"neet_jee",name:"NEET / JEE 2025",shortName:"NEET/JEE",category:"India & Global",mode:"photo",widthPx:350,heightPx:450,minKb:10,maxKb:50,ratioLabel:"7:9",defaultBg:"blue",bgLabel:"Sky Blue / White BG",dpi:300,icon:"biotech",sigDims:"140 \xD7 60 px",sigMaxKb:"4\u201330 KB",note:"NTA NEET / JEE 2025: 3.5\xD74.5 cm (350\xD7450 px), 10\u201350 KB JPG/JPEG."},us_visa:{id:"us_visa",name:"US Visa / OCI (2\xD72 in)",shortName:"US Visa",category:"India & Global",mode:"photo",widthPx:600,heightPx:600,minKb:20,maxKb:200,ratioLabel:"1:1",defaultBg:"white",bgLabel:"Pure White BG",dpi:300,icon:"public",sigDims:"N/A",sigMaxKb:"N/A",note:"US Department of State & OCI: 2\xD72 inches (600\xD7600 px at 300 DPI)."}},ye=["buet","dgme","du","gst","ckruet","buet_sig","bsmmu","neet_jee","us_visa"];var Me={lowConfidenceCut:18,highConfidenceCut:230,holeFillMode:"smart",speckleCleanupStrength:50,chokePx:0,featherPx:0,bypassRefinement:!1};function we(o,e,t){let n=e*t;if(n===0)return!1;let s=0,a=0,f=Math.max(1,Math.floor(e/32)),i=Math.max(1,Math.floor(t/32));for(let r=0;r<t;r+=i)for(let h=0;h<e;h+=f){let m=o[(r*e+h)*4+3];m<245?s++:m>=250&&a++}let u=[0,e-1,(t-1)*e,(t-1)*e+(e-1)];for(let r of u)r>=0&&r<n&&o[r*4+3]<245&&(s+=2);return s>=2&&a>=4}function ke(o,e,t){let n=Math.max(1,o),s=Math.max(1,e),a=Math.min(t/n,t/s),f=Math.max(1,Math.min(t,Math.round(n*a))),i=Math.max(1,Math.min(t,Math.round(s*a))),u=Math.floor((t-f)/2),r=Math.floor((t-i)/2);return{targetSize:t,scaledW:f,scaledH:i,padLeft:u,padTop:r}}function Pe(o,e,t,n,s,a){let f=new Uint8Array(n*s);if(n<=0||s<=0||e<=0||t<=0)return f;let i=a?a.padLeft/a.targetSize*e:0,u=a?a.padTop/a.targetSize*t:0,r=a?a.scaledW/a.targetSize*e:e,h=a?a.scaledH/a.targetSize*t:t;for(let m=0;m<s;m++){let E=s>1?m/(s-1):0,b=Math.max(0,Math.min(t-1,u+E*Math.max(1,h-1))),l=Math.floor(b),p=Math.min(t-1,l+1),x=b-l,v=m*n,c=l*e,g=p*e;for(let y=0;y<n;y++){let k=n>1?y/(n-1):0,P=Math.max(0,Math.min(e-1,i+k*Math.max(1,r-1))),d=Math.floor(P),w=Math.min(e-1,d+1),M=P-d,C=o[c+d],S=o[c+w],T=o[g+d],I=o[g+w],A=C*(1-M)+S*M,D=T*(1-M)+I*M,H=A*(1-x)+D*x;f[v+y]=Math.max(0,Math.min(255,Math.round(H)))}}return f}function Y(o,e,t,n){let s=e*t;if(s===0)return{backgroundSpeckleCount:0,foregroundHoleCount:0,boundarySmoothnessPct:100,foregroundCoveragePct:0};let a=new Uint8Array(s),f=new Int32Array(s),i=0,u=0;for(let v=0;v<s;v++)if(o[v]>=128&&u++,o[v]>=24&&a[v]===0){i++;let c=0,g=0;for(a[v]=1,f[g++]=v;c<g;){let y=f[c++],k=y%e,P=(y-k)/e;if(k>0){let d=y-1;!a[d]&&o[d]>=24&&(a[d]=1,f[g++]=d)}if(k+1<e){let d=y+1;!a[d]&&o[d]>=24&&(a[d]=1,f[g++]=d)}if(P>0){let d=y-e;!a[d]&&o[d]>=24&&(a[d]=1,f[g++]=d)}if(P+1<t){let d=y+e;!a[d]&&o[d]>=24&&(a[d]=1,f[g++]=d)}}}let r=Math.max(0,i-1),h=new Uint8Array(s),m=0;for(let v=0;v<s;v++)if(o[v]<210&&h[v]===0){let c=0,g=0,y=!1;for(h[v]=1,f[g++]=v;c<g;){let k=f[c++],P=k%e,d=(k-P)/e;if((P===0||P===e-1||d===0||d===t-1)&&(y=!0),P>0){let w=k-1;!h[w]&&o[w]<210&&(h[w]=1,f[g++]=w)}if(P+1<e){let w=k+1;!h[w]&&o[w]<210&&(h[w]=1,f[g++]=w)}if(d>0){let w=k-e;!h[w]&&o[w]<210&&(h[w]=1,f[g++]=w)}if(d+1<t){let w=k+e;!h[w]&&o[w]<210&&(h[w]=1,f[g++]=w)}}y||m++}let E=0,b=0;for(let v=1;v<t-1;v++)for(let c=1;c<e-1;c++){let g=v*e+c,y=o[g],k=o[g-1],P=o[g+1],d=o[g-e],w=o[g+e];if(Math.max(Math.abs(y-k),Math.abs(y-P),Math.abs(y-d),Math.abs(y-w))>15){E++;let C=Math.abs(4*y-(k+P+d+w))/4;b+=Math.max(0,1-C/255)}}let l=E>0?Math.round(b/E*100):96,p=Number((u/s*100).toFixed(1)),x={backgroundSpeckleCount:r,foregroundHoleCount:m,boundarySmoothnessPct:l,foregroundCoveragePct:p};if(n&&n.length===s){let v=0,c=0,g=0,y=0,k=0,P=0;for(let M=0;M<s;M++){let C=o[M]>=128,S=n[M]>=128;C&&S&&v++,(C||S)&&c++,g+=Math.abs(o[M]-n[M])/255}for(let M=1;M<t-1;M++)for(let C=1;C<e-1;C++){let S=M*e+C,T=Math.abs(o[S]-o[S-1])>35||Math.abs(o[S]-o[S-e])>35,I=Math.abs(n[S]-n[S-1])>35||Math.abs(n[S]-n[S-e])>35;T&&k++,I&&y++,T&&I&&P++}x.iouPct=c>0?Number((v/c*100).toFixed(1)):100;let d=k>0?P/k:1,w=y>0?P/y:1;x.boundaryF1Pct=d+w>0?Number((2*d*w/(d+w)*100).toFixed(1)):100,x.maePct=Number((g/s*100).toFixed(2))}return x}function Ke(o,e,t){let n=e*t;if(n===0)return;let s=new Uint8Array(n),a=new Int32Array(n),f=0,i=0;for(let u=0;u<e;u++){o[u]<128&&(s[u]=1,a[i++]=u);let r=(t-1)*e+u;o[r]<128&&!s[r]&&(s[r]=1,a[i++]=r)}for(let u=0;u<t;u++){let r=u*e;o[r]<128&&!s[r]&&(s[r]=1,a[i++]=r);let h=u*e+(e-1);o[h]<128&&!s[h]&&(s[h]=1,a[i++]=h)}for(;f<i;){let u=a[f++],r=u%e,h=u/e|0;if(r>0){let m=u-1;!s[m]&&o[m]<128&&(s[m]=1,a[i++]=m)}if(r<e-1){let m=u+1;!s[m]&&o[m]<128&&(s[m]=1,a[i++]=m)}if(h>0){let m=u-e;!s[m]&&o[m]<128&&(s[m]=1,a[i++]=m)}if(h<t-1){let m=u+e;!s[m]&&o[m]<128&&(s[m]=1,a[i++]=m)}}for(let u=0;u<n;u++)!s[u]&&o[u]<200&&(o[u]=255)}function ie(o,e,t,n){let s=e*t,a=new Uint8Array(s);if(s===0)return a;if(n?.bypassRefinement){for(let b=0;b<s;b++)a[b]=o[b];return a}let f=n?.lowClamp??18,i=n?.highClamp??230,u=n?.keepLargestComponent??!0,r=n?.holeFillMode??(n?.fillInteriorHoles===!1?"off":"smart"),h=n?.speckleCleanupStrength??50,m=n?.sourceRgba??null,E=Math.max(1,i-f);for(let b=0;b<s;b++){let l=o[b];if(l<=f)a[b]=0;else if(l>=i)a[b]=255;else{let p=(l-f)/E,x=p*p*(3-2*p);a[b]=Math.round(x*255)}}if(u&&h>0&&e>=6&&t>=6){let b=new Uint8Array(s),l=new Int32Array(s),p=[0],x=new Int32Array(s),v=0,c=0;for(let g=0;g<s;g++)if(a[g]>=32&&b[g]===0){v++;let y=0,k=0;for(b[g]=1,l[g]=v,x[k++]=g;y<k;){let P=x[y++],d=P%e,w=(P-d)/e;if(d>0){let M=P-1;b[M]===0&&a[M]>=32&&(b[M]=1,l[M]=v,x[k++]=M)}if(d+1<e){let M=P+1;b[M]===0&&a[M]>=32&&(b[M]=1,l[M]=v,x[k++]=M)}if(w>0){let M=P-e;b[M]===0&&a[M]>=32&&(b[M]=1,l[M]=v,x[k++]=M)}if(w+1<t){let M=P+e;b[M]===0&&a[M]>=32&&(b[M]=1,l[M]=v,x[k++]=M)}}p[v]=k,k>c&&(c=k)}if(c>0){let g=5e-4+h/100*.035,y=Math.max(4,Math.floor(c*g));for(let k=0;k<s;k++){let P=l[k];P>0&&p[P]<y&&(a[k]=0)}}}if(r==="aggressive")Ke(a,e,t);else if(r==="smart"&&e>=6&&t>=6){let b=new Uint8Array(s),l=new Int32Array(s),p=0,x=0;for(let d=0;d<e;d++){a[d]<180&&(b[d]=1,l[x++]=d);let w=(t-1)*e+d;a[w]<180&&!b[w]&&(b[w]=1,l[x++]=w)}for(let d=0;d<t;d++){let w=d*e;a[w]<180&&!b[w]&&(b[w]=1,l[x++]=w);let M=d*e+(e-1);a[M]<180&&!b[M]&&(b[M]=1,l[x++]=M)}let v=235,c=235,g=235,y=0;for(;p<x;){let d=l[p++];m&&a[d]<30&&(v+=m[d*4],c+=m[d*4+1],g+=m[d*4+2],y++);let w=d%e,M=d/e|0;if(w>0){let C=d-1;!b[C]&&a[C]<180&&(b[C]=1,l[x++]=C)}if(w<e-1){let C=d+1;!b[C]&&a[C]<180&&(b[C]=1,l[x++]=C)}if(M>0){let C=d-e;!b[C]&&a[C]<180&&(b[C]=1,l[x++]=C)}if(M<t-1){let C=d+e;!b[C]&&a[C]<180&&(b[C]=1,l[x++]=C)}}y>0&&(v/=y,c/=y,g/=y);let k=new Uint8Array(s),P=new Int32Array(s);for(let d=0;d<s;d++)if(!b[d]&&a[d]<235&&!k[d]){let w=0,M=0;k[d]=1,P[M++]=d;let C=0,S=0,T=0,I=0,A=0,D=0,H=0,O=0;for(;w<M;){let R=P[w++];C+=o[R],m&&(S+=m[R*4],T+=m[R*4+1],I+=m[R*4+2]);let $=R%e,F=(R-$)/e,K=[$>0?R-1:-1,$+1<e?R+1:-1,F>0?R-e:-1,F+1<t?R+e:-1];for(let U of K)U<0||(!b[U]&&a[U]<235?k[U]||(k[U]=1,P[M++]=U):a[U]>=235&&m&&(A+=m[U*4],D+=m[U*4+1],H+=m[U*4+2],O++))}let _=M,z=_/s,Q=C/Math.max(1,_),L=!1;if(!m&&z<=.015)L=!0;else if(z<=.002)L=!0;else if(Q>=48)L=!0;else if(m&&O>0){let R=S/_,$=T/_,F=I/_,K=A/O,U=D/O,X=H/O,V=Math.hypot(R-K,$-U,F-X),ee=Math.hypot(R-v,$-c,F-g);(V<ee*.85||ee>55)&&(L=!0)}else z<=.04&&(L=!0);if(L)for(let R=0;R<M;R++)a[P[R]]=255}}return a}function ve(o,e,t,n,s){if(n<=0)return new Float32Array(o);let a=new Float32Array(e*t),f=n*n+.35;for(let i=0;i<t;i++)for(let u=0;u<e;u++){let r=i*e+u,h=o[r];for(let m=-n;m<=n;m++){let E=i+m;if(E<0||E>=t){s&&(h=0);continue}for(let b=-n;b<=n;b++){if(b*b+m*m>f)continue;let l=u+b;if(l<0||l>=e){s&&(h=0);continue}let p=o[E*e+l];s?p<h&&(h=p):p>h&&(h=p)}}a[r]=h}return a}function We(o,e,t,n){let s=Math.max(0,Math.min(3,n));if(s<=.05)return new Float32Array(o);let a=Math.ceil(s),f=Math.max(.45,s*.65),i=[],u=0;for(let m=-a;m<=a;m++){let E=Math.exp(-(m*m)/(2*f*f));i.push(E),u+=E}for(let m=0;m<i.length;m++)i[m]/=u;let r=new Float32Array(e*t),h=new Float32Array(e*t);for(let m=0;m<t;m++){let E=m*e;for(let b=0;b<e;b++){let l=0;for(let p=-a;p<=a;p++){let x=Math.max(0,Math.min(e-1,b+p));l+=o[E+x]*i[p+a]}r[E+b]=l}}for(let m=0;m<t;m++)for(let E=0;E<e;E++){let b=0;for(let l=-a;l<=a;l++){let p=Math.max(0,Math.min(t-1,m+l));b+=r[p*e+E]*i[l+a]}h[m*e+E]=b}return h}function Be(o,e,t,n,s,a){let f=t*n,i=new Float32Array(f);for(let p=0;p<f;p++)i[p]=e[p];let u=new Uint8Array(f),r=3;for(let p=0;p<n;p++)for(let x=0;x<t;x++){let v=p*t+x,c=e[v];if(c>8&&c<248){u[v]=1;continue}let g=c>=248,y=!1;for(let k=-r;k<=r&&!y;k++){let P=p+k;if(P<0||P>=n){g&&(y=!0);continue}for(let d=-r;d<=r;d++){let w=x+d;if(w<0||w>=t){if(g){y=!0;break}continue}let M=e[P*t+w];if(g?M<242:M>12){y=!0;break}}}y&&(u[v]=1)}let h=Math.max(-2,Math.min(2,s)),m;if(Math.abs(h)<.05)m=i;else{let p=h<0,x=Math.abs(h),v=Math.floor(x),c=Math.ceil(x),g=x-v,y=v===0?i:ve(i,t,n,v,p);if(g<.05||v===c)m=y;else{let k=ve(i,t,n,c,p);m=new Float32Array(f);for(let P=0;P<f;P++)m[P]=y[P]*(1-g)+k[P]*g}}let E=We(m,t,n,a),b=new Uint8Array(f*3);for(let p=0;p<f;p++){let x=p*4,v=p*3;b[v]=o[x],b[v+1]=o[x+1],b[v+2]=o[x+2]}let l=h<0?Math.min(.45,Math.abs(h)*.22):0;for(let p=0;p<n;p++)for(let x=0;x<t;x++){let v=p*t+x,c=v*4;if(u[v]===0){o[c+3]=e[v];continue}let g=Math.max(0,Math.min(255,Math.round(E[v])));if(o[c+3]=g,g>4&&g<252){let y=0,k=b[v*3],P=b[v*3+1],d=b[v*3+2];for(let w=-2;w<=2;w++){let M=p+w;if(!(M<0||M>=n))for(let C=-2;C<=2;C++){let S=x+C;if(S<0||S>=t)continue;let T=M*t+S,I=e[T];I>y&&I>=235&&(y=I,k=b[T*3],P=b[T*3+1],d=b[T*3+2])}}if(y>=235){let w=Math.min(.92,(1-g/255)*.78+l);o[c]=Math.round(o[c]*(1-w)+k*w),o[c+1]=Math.round(o[c+1]*(1-w)+P*w),o[c+2]=Math.round(o[c+2]*(1-w)+d*w)}}}}function Ee(o,e,t,n,s,a="original",f=24){let i=e*t,u=new Float32Array(i),r=new Uint8Array(i);for(let c=0;c<i;c++){let g=c*4;o[g+3]>=242?(r[c]=1,u[c]=.299*o[g]+.587*o[g+1]+.114*o[g+2]):(r[c]=0,u[c]=0)}let h=e+1,m=new Float64Array((e+1)*(t+1)),E=new Int32Array((e+1)*(t+1));for(let c=1;c<=t;c++){let g=0,y=0,k=c*h,P=(c-1)*h,d=(c-1)*e;for(let w=1;w<=e;w++){let M=d+(w-1);g+=u[M],y+=r[M],m[k+w]=m[P+w]+g,E[k+w]=E[P+w]+y}}let b=Math.max(1,Math.min(e,t)/120),l=Math.max(8,Math.round(f*Math.min(1.5,Math.max(.5,b*.5)))),p=Math.max(4,Math.round(l/2)),x;s<=45?x=Math.max(.04,Math.min(.32,s/100)):x=Math.max(.05,Math.min(.28,(235-s)/640));let v=typeof a=="boolean"?a?"mono":"original":a;for(let c=0;c<t;c++){let g=Math.max(0,c-p),y=Math.min(t-1,c+p);for(let k=0;k<e;k++){let P=c*e+k,d=P*4;if(r[P]===0||k>0&&r[P-1]===0||k+1<e&&r[P+1]===0||c>0&&r[P-e]===0||c+1<t&&r[P+e]===0){n?o[d+3]=0:(o[d]=255,o[d+1]=255,o[d+2]=255,o[d+3]=255);continue}let M=Math.max(0,k-p),C=Math.min(e-1,k+p),S=m[(y+1)*h+(C+1)]-m[g*h+(C+1)]-m[(y+1)*h+M]+m[g*h+M],T=E[(y+1)*h+(C+1)]-E[g*h+(C+1)]-E[(y+1)*h+M]+E[g*h+M],I=S/Math.max(1,T),A=u[P],D=I*(1-x),H=Math.max(6,I*.055);if(A>=D+H*.35)n?o[d+3]=0:(o[d]=255,o[d+1]=255,o[d+2]=255,o[d+3]=255);else{let O=Math.min(1,Math.max(.18,(D+H*.35-A)/(H*1.45))),_=Math.min(1,Math.pow(O,.72)*1.15);if(v==="mono")o[d]=10,o[d+1]=12,o[d+2]=16;else{let z=o[d],Q=o[d+1],L=o[d+2],R=255/Math.max(80,I),$=Math.min(255,z*R),F=Math.min(255,Q*R),K=Math.min(255,L*R),U=($+F+K)/3,X=1.65,V=.58;o[d]=Math.max(0,Math.min(220,Math.round((U+($-U)*X)*V))),o[d+1]=Math.max(0,Math.min(220,Math.round((U+(F-U)*X)*V))),o[d+2]=Math.max(0,Math.min(245,Math.round((U+(K-U)*X)*V)))}n?o[d+3]=Math.round(_*255):(o[d]=Math.round(o[d]*_+255*(1-_)),o[d+1]=Math.round(o[d+1]*_+255*(1-_)),o[d+2]=Math.round(o[d+2]*_+255*(1-_)),o[d+3]=255)}}}}var ze="https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2",Xe="https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm",Ve="https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",Se=new Function("moduleUrl","return import(moduleUrl)"),B=null,te=null,ne=!1,N={...Me},Ce=new Map,de=new Set,ce={rmbg_14:"briaai/RMBG-1.4 (1024px Studio AI)",modnet:"Xenova/modnet (Portrait Matting AI)",imgly_medium:"IMG.LY ISNet Medium (ONNX)"},Ye={activeModelId:"briaai/RMBG-1.4",modelVersion:"@huggingface/transformers@3.1.2",inferenceBackend:typeof navigator<"u"&&navigator.gpu?"webgpu (ready)":"wasm (1-thread)",status:"idle",inferenceDurationMs:0,sourceWidth:0,sourceHeight:0,rawDiagnostics:null,refinedDiagnostics:null,errorMessage:null},G={status:"idle",progressPct:0,stageLabel:"Neural Portrait AI Ready",detailText:"briaai/RMBG-1.4 & Xenova/modnet \u2022 100% On-Device",cachedInIndexedDB:!1,engineName:ce.rmbg_14,modelTier:"rmbg_14",isPreClippedAlpha:!1,diagnostics:{...Ye}};function Ie(o){return de.add(o),o(G),()=>de.delete(o)}function Te(){return G.diagnostics}function Ae(){return{...N}}function j(o){G={...G,...o,diagnostics:o.diagnostics?{...G.diagnostics,...o.diagnostics}:G.diagnostics};for(let e of de)e(G)}function ae(o,e){return!o||!B||B.sourceSrc!==o.src?null:B.isPreClippedAlpha||!e||B.modelTier===e?B:null}function me(){if(B?.imageBitmap&&typeof B.imageBitmap.close=="function")try{B.imageBitmap.close()}catch{}B=null,te=null}function q(o,e,t,n,s){let a=s??document.createElement("canvas");a.width!==t&&(a.width=t),a.height!==n&&(a.height=n);let f=a.getContext("2d");if(f){let i=f.createImageData(t,n),u=i.data,r=t*n;for(let h=0;h<r;h++){let m=h*4;u[m]=o[m],u[m+1]=o[m+1],u[m+2]=o[m+2],u[m+3]=e[h]}f.putImageData(i,0,0)}return a}function ue(o){let e=Math.max(1,o.naturalWidth||o.width),t=Math.max(1,o.naturalHeight||o.height),n=document.createElement("canvas");n.width=e,n.height=t;let s=n.getContext("2d");if(!s)throw new Error("Could not initialize 2D canvas context");return s.drawImage(o,0,0,e,t),{rgba:s.getImageData(0,0,e,t).data,width:e,height:t}}function qe(o,e){let t=Math.max(1,o.naturalWidth||o.width),n=Math.max(1,o.naturalHeight||o.height),s=ke(t,n,e),a=document.createElement("canvas");a.width=e,a.height=e;let f=a.getContext("2d");return f&&(f.fillStyle="#808080",f.fillRect(0,0,e,e),f.imageSmoothingEnabled=!0,f.imageSmoothingQuality="high",f.drawImage(o,0,0,t,n,s.padLeft,s.padTop,s.scaledW,s.scaledH)),{dataUrl:a.toDataURL("image/png"),letterbox:s}}function re(o){if(N={...N,...o},!B)return!1;let e=ie(B.rawAlphaMask,B.width,B.height,{lowClamp:N.lowConfidenceCut,highClamp:N.highConfidenceCut,holeFillMode:N.holeFillMode,speckleCleanupStrength:N.speckleCleanupStrength,sourceRgba:B.sourceRgba,bypassRefinement:N.bypassRefinement});B.refinedBaseAlpha=e,B.alphaMask=new Uint8Array(e),B.undoStack=[],B.redoStack=[],q(B.sourceRgba,B.alphaMask,B.width,B.height,B.maskCanvas),B.imageBitmap=B.maskCanvas;let t=Y(B.alphaMask,B.width,B.height);return B.diagnostics.refinedDiagnostics=t,j({diagnostics:B.diagnostics}),!0}function pe(o,e="rmbg_14"){try{let t=performance.now(),{rgba:n,width:s,height:a}=ue(o);if(!we(n,s,a))return null;let f=s*a,i=new Uint8Array(f);for(let p=0;p<f;p++)i[p]=n[p*4+3];let u=Y(i,s,a),r=ie(i,s,a,{lowClamp:N.lowConfidenceCut,highClamp:N.highConfidenceCut,holeFillMode:N.holeFillMode,speckleCleanupStrength:N.speckleCleanupStrength,sourceRgba:n,bypassRefinement:N.bypassRefinement}),h=Y(r,s,a),m=q(n,r,s,a),b={activeModelId:"Pre-Clipped Transparent PNG",modelVersion:"Native Alpha Channel",inferenceBackend:"native-png-alpha (0ms GPU)",status:"preclipped",inferenceDurationMs:Math.max(1,Math.round(performance.now()-t)),sourceWidth:s,sourceHeight:a,rawDiagnostics:u,refinedDiagnostics:h,errorMessage:null},l={sourceSrc:o.src,modelTier:e,imageBitmap:m,maskCanvas:m,rawAlphaMask:i,refinedBaseAlpha:new Uint8Array(r),alphaMask:new Uint8Array(r),undoStack:[],redoStack:[],sourceRgba:n,width:s,height:a,engineName:"Pre-Clipped Transparent PNG (Samsung / Native Cutout)",isPreClippedAlpha:!0,diagnostics:b};return B=l,j({status:"preclipped",progressPct:100,stageLabel:"Pre-Clipped Transparent PNG Detected \u2014 Backdrop Studio Ready",detailText:`Instant 60fps Backdrop Fill \u2022 Speckles: ${h.backgroundSpeckleCount} \u2022 Holes: ${h.foregroundHoleCount}`,cachedInIndexedDB:!0,engineName:l.engineName,modelTier:e,isPreClippedAlpha:!0,diagnostics:b}),l}catch(t){return console.warn("Pre-clipped transparency detection skipped:",t),null}}function Re(){B&&(B.undoStack.push(new Uint8Array(B.alphaMask)),B.undoStack.length>25&&B.undoStack.shift(),B.redoStack=[])}function Le(){if(!B||B.undoStack.length===0)return!1;let o=B.undoStack.pop();return B.redoStack.push(new Uint8Array(B.alphaMask)),B.alphaMask=o,q(B.sourceRgba,B.alphaMask,B.width,B.height,B.maskCanvas),B.imageBitmap=B.maskCanvas,!0}function Ue(){if(!B||B.redoStack.length===0)return!1;let o=B.redoStack.pop();return B.undoStack.push(new Uint8Array(B.alphaMask)),B.alphaMask=o,q(B.sourceRgba,B.alphaMask,B.width,B.height,B.maskCanvas),B.imageBitmap=B.maskCanvas,!0}function he(){return!!(B&&B.undoStack.length>0)}function fe(){return!!(B&&B.redoStack.length>0)}function De(o,e,t,n){if(!B)return!1;let{width:s,height:a,alphaMask:f,sourceRgba:i,maskCanvas:u}=B,r=Math.round(o*(s-1)),h=Math.round(e*(a-1)),m=Math.max(2,Math.round(t)),E=m*m,b=n==="erase"?0:255,l=Math.max(0,h-m),p=Math.min(a-1,h+m),x=Math.max(0,r-m),v=Math.min(s-1,r+m);for(let c=l;c<=p;c++){let g=c-h,y=c*s;for(let k=x;k<=v;k++){let P=k-r,d=P*P+g*g;if(d<=E){let M=Math.sqrt(d)/m;if(M<=.75)f[y+k]=b;else{let C=(1-M)/.25,S=f[y+k];f[y+k]=Math.round(S+(b-S)*C)}}}}return q(i,f,s,a,u),B.imageBitmap=u,!0}async function Je(o,e,t){let n=e==="modnet"?"Xenova/modnet":"briaai/RMBG-1.4",s=e==="modnet"?512:1024;j({status:"downloading",progressPct:8,stageLabel:`Loading ${t} (8%)`,detailText:`Importing @huggingface/transformers@3.1.2 (${n})\u2026`,cachedInIndexedDB:ne,engineName:t,modelTier:e,isPreClippedAlpha:!1,diagnostics:{...G.diagnostics,activeModelId:n,modelVersion:"@huggingface/transformers@3.1.2",status:"downloading",errorMessage:null}});let a=await Se(ze),{AutoModel:f,AutoProcessor:i,RawImage:u,env:r}=a;r&&(r.allowLocalModels=!1,r.useBrowserCache=!0,r.backends?.onnx?.wasm&&(r.backends.onnx.wasm.numThreads=1));let h=Ce.get(n);if(!h){let T=new Map,I=L=>{if(L&&(L.status==="progress"||L.status==="downloading")&&typeof L.loaded=="number"&&typeof L.total=="number"&&L.total>0){let R=String(L.file||"weights");T.set(R,{loaded:L.loaded,total:L.total});let $=0,F=0;for(let ee of T.values())$+=ee.loaded,F+=ee.total;let K=F>0?Math.min(1,$/F):.4,U=Math.max(10,Math.min(76,Math.round(10+K*66))),X=($/(1024*1024)).toFixed(1),V=(F/(1024*1024)).toFixed(1);j({status:"downloading",progressPct:U,stageLabel:`Downloading ${n}: ${U}%`,detailText:`${X} / ${V} MB \u2022 Cached in Browser IndexedDB`,cachedInIndexedDB:ne,engineName:t,modelTier:e,isPreClippedAlpha:!1})}},A=typeof navigator<"u"&&!!navigator.gpu,D=L=>{let R={device:L?"webgpu":"wasm",dtype:L?"fp32":"q8",progress_callback:I};return n==="briaai/RMBG-1.4"&&(R.config={model_type:"custom"}),R},H="wasm (q8, 1-thread)",O=async()=>{if(A)try{let L=await f.from_pretrained(n,D(!0));return H="webgpu (fp32)",L}catch(L){console.warn(`WebGPU adapter failed for ${n}, using WASM q8 engine:`,L)}return H="wasm (q8, 1-thread)",await f.from_pretrained(n,D(!1))},_=n==="briaai/RMBG-1.4"?{do_normalize:!0,do_pad:!1,do_rescale:!0,do_resize:!0,image_mean:[.5,.5,.5],feature_extractor_type:"ImageFeatureExtractor",image_std:[1,1,1],resample:2,rescale_factor:.00392156862745098,size:{width:1024,height:1024}}:void 0,[z,Q]=await Promise.all([O(),i.from_pretrained(n,{progress_callback:I,..._?{config:_}:{}})]);h={model:z,processor:Q,backendUsed:H},Ce.set(n,h),ne=!0}j({status:"inferring",progressPct:84,stageLabel:`Segmenting Subject (${n}): 84%`,detailText:`Running ${h.backendUsed} inference with aspect-preserved geometry\u2026`,cachedInIndexedDB:!0,engineName:t,modelTier:e,isPreClippedAlpha:!1,diagnostics:{...G.diagnostics,activeModelId:n,inferenceBackend:h.backendUsed,status:"inferring"}});let m=Math.max(1,o.naturalWidth||o.width),E=Math.max(1,o.naturalHeight||o.height),{dataUrl:b,letterbox:l}=qe(o,s),p=await u.fromURL(b),{pixel_values:x}=await h.processor(p),{output:v}=await h.model({input:x}),c=v[0].mul(255).to("uint8"),g=await u.fromTensor(c),y=Math.max(1,g.width),k=Math.max(1,g.height),P=g.data,d=y*k,w=Math.max(1,Math.round(P.length/d)),M=new Uint8Array(d);for(let T=0;T<d;T++)M[T]=P[T*w];let C=Pe(M,y,k,m,E,l),S=0;for(let T=0;T<C.length;T++)C[T]>S&&(S=C[T]);if(S===0)throw new Error(`${n} produced an empty alpha mask.`);return{rawAlpha:C,backendUsed:h.backendUsed,modelId:n}}async function Ze(o,e,t){let n=await Se(Xe),s=n.removeBackground??n.default;if(typeof s!="function")throw new Error("removeBackground export not found in @imgly/background-removal@1.7.0");let a=typeof navigator<"u"&&!!navigator.gpu,f=a?"gpu":"cpu",i=a?"webgpu (imgly)":"wasm (imgly cpu)",u=e??o.src,r=new Map,h=await s(u,{publicPath:Ve,model:"medium",device:f,output:{format:"image/png",quality:1},progress:(E,b,l)=>{if(E.startsWith("fetch:")){r.set(E,{cur:Math.max(0,b),tot:Math.max(1,l)});let p=0,x=0;for(let g of r.values())p+=g.cur,x+=g.tot;let v=x>0?Math.min(1,p/x):.5,c=Math.max(8,Math.min(75,Math.round(8+v*67)));j({status:"downloading",progressPct:c,stageLabel:`Downloading ${t}: ${c}%`,detailText:`${t} \u2022 staticimgly.com CDN`,cachedInIndexedDB:ne,engineName:t,modelTier:"imgly_medium",isPreClippedAlpha:!1})}else if(E.startsWith("compute:")){ne=!0;let p=l>0?Math.min(1,b/l):.6,x=Math.max(76,Math.min(98,Math.round(76+p*22)));j({status:"inferring",progressPct:x,stageLabel:`Segmenting Portrait: ${x}%`,detailText:`Running ${t} neural inference\u2026`,cachedInIndexedDB:!0,engineName:t,modelTier:"imgly_medium",isPreClippedAlpha:!1})}}}),m=URL.createObjectURL(h);try{let E=await new Promise((c,g)=>{let y=new Image;y.onload=()=>c(y),y.onerror=k=>g(k),y.src=m}),{rgba:b,width:l,height:p}=ue(E),x=l*p,v=new Uint8Array(x);for(let c=0;c<x;c++)v[c]=b[c*4+3];return{rawAlpha:v,backendUsed:i,modelId:"@imgly/background-removal@1.7.0 (medium)"}}finally{URL.revokeObjectURL(m)}}async function Ne(o,e,t="rmbg_14",n,s=!1){let a=o.src;if(!a)return null;if(!s){if(B&&B.sourceSrc===a&&B.isPreClippedAlpha)return n?.(B),B;let r=pe(o,t);if(r)return n?.(r),r}let f=`${a}::${t}`;if(B&&B.sourceSrc===a&&B.modelTier===t&&!B.isPreClippedAlpha)return j({status:"ready",progressPct:100,stageLabel:`${B.diagnostics.activeModelId} Ready (${B.diagnostics.inferenceDurationMs}ms)`,detailText:`${B.diagnostics.inferenceBackend} \u2022 Speckles: ${B.diagnostics.refinedDiagnostics?.backgroundSpeckleCount??0} \u2022 Holes: ${B.diagnostics.refinedDiagnostics?.foregroundHoleCount??0}`,cachedInIndexedDB:!0,engineName:B.engineName,modelTier:t,isPreClippedAlpha:!1,diagnostics:B.diagnostics}),n?.(B),B;if(te===f)return null;te=f;let i=ce[t]||ce.rmbg_14,u=performance.now();try{let{rgba:r,width:h,height:m}=ue(o),E;t==="rmbg_14"||t==="modnet"?E=await Je(o,t,i):E=await Ze(o,e,i);let b=Math.max(1,Math.round(performance.now()-u)),l=Y(E.rawAlpha,h,m),p=ie(E.rawAlpha,h,m,{lowClamp:N.lowConfidenceCut,highClamp:N.highConfidenceCut,holeFillMode:N.holeFillMode,speckleCleanupStrength:N.speckleCleanupStrength,sourceRgba:r,bypassRefinement:N.bypassRefinement}),x=Y(p,h,m),v=q(r,p,h,m),c={activeModelId:E.modelId,modelVersion:t==="imgly_medium"?"@imgly/background-removal@1.7.0":"@huggingface/transformers@3.1.2",inferenceBackend:E.backendUsed,status:"ready",inferenceDurationMs:b,sourceWidth:h,sourceHeight:m,rawDiagnostics:l,refinedDiagnostics:x,errorMessage:null},g={sourceSrc:a,modelTier:t,imageBitmap:v,maskCanvas:v,rawAlphaMask:E.rawAlpha,refinedBaseAlpha:new Uint8Array(p),alphaMask:new Uint8Array(p),undoStack:[],redoStack:[],sourceRgba:r,width:h,height:m,engineName:i,isPreClippedAlpha:!1,diagnostics:c};return B=g,te=null,j({status:"ready",progressPct:100,stageLabel:`${E.modelId} Ready (${b}ms)`,detailText:`${E.backendUsed} \u2022 Speckles: ${l.backgroundSpeckleCount}\u2192${x.backgroundSpeckleCount} \u2022 Holes: ${l.foregroundHoleCount}\u2192${x.foregroundHoleCount}`,cachedInIndexedDB:!0,engineName:i,modelTier:t,isPreClippedAlpha:!1,diagnostics:c}),n?.(g),g}catch(r){console.error(`Neural segmentation error (${t}):`,r),te=null;let h=r instanceof Error?r.message:String(r||"Unknown model error"),m={activeModelId:t==="modnet"?"Xenova/modnet":t==="imgly_medium"?"@imgly/background-removal@1.7.0":"briaai/RMBG-1.4",modelVersion:"@huggingface/transformers@3.1.2",inferenceBackend:"error",status:"error",inferenceDurationMs:Math.round(performance.now()-u),sourceWidth:o.naturalWidth||0,sourceHeight:o.naturalHeight||0,rawDiagnostics:null,refinedDiagnostics:null,errorMessage:h};return j({status:"error",progressPct:0,stageLabel:`Model Error (${m.activeModelId}): ${h.slice(0,42)}`,detailText:`Error: ${h} \u2014 Click to retry or select another engine.`,cachedInIndexedDB:!1,engineName:i,modelTier:t,isPreClippedAlpha:!1,diagnostics:m}),n?.(null),null}}var le=[{id:"dark_hair_dark_bg",title:"1. Dark Hair on Dark Background",subtitle:"Low-contrast dark curls against a charcoal studio wall",challengeTag:"Low Contrast Silhouette",width:320,height:380},{id:"black_shirt_hoodie",title:"2. Black Shirt / Hoodie",subtitle:"Deep matte-black fabric prone to salt-and-pepper interior holes",challengeTag:"Interior Solidity",width:320,height:380},{id:"glasses_portrait",title:"3. Subject Wearing Glasses",subtitle:"Thin dark eyeglass frames with specular lens reflections",challengeTag:"Fine Frame Preservation",width:320,height:380},{id:"hands_fingers_gap",title:"4. Hands / Fingers & Arm-Torso Gap",subtitle:"Raised hand near shoulder with a real background gap under arm",challengeTag:"Smart Hole Distinction",width:320,height:380},{id:"fine_hair_bright_wall",title:"5. Fine Hair on Bright Wall",subtitle:"Backlit wisps against a high-luminance sunlit wall (halo test)",challengeTag:"Edge Halo & Defringe",width:320,height:380},{id:"outdoor_night",title:"6. Outdoor Night / Bokeh Lights",subtitle:"Warm streetlamps and high-ISO background chroma grain",challengeTag:"Background Speckle Suppression",width:320,height:380},{id:"uneven_lighting_shadow",title:"7. Uneven Lighting & Wall Shadow",subtitle:"Directional desk lamp casting a diagonal shadow behind shoulder",challengeTag:"Shadow Rejection",width:320,height:380},{id:"multi_person_distracting",title:"8. Distracting Background Objects",subtitle:"Primary applicant with a secondary bystander silhouette in corner",challengeTag:"Primary Subject Isolation",width:320,height:380}];function Qe(o){return new Promise((e,t)=>{let n=new Image;n.onload=()=>e(n),n.onerror=s=>t(s),n.src=o})}async function _e(o){let e=le.find(c=>c.id===o)||le[0],{width:t,height:n}=e,s=document.createElement("canvas");s.width=t,s.height=n;let a=s.getContext("2d");if(e.id==="dark_hair_dark_bg"){let c=a.createLinearGradient(0,0,t,n);c.addColorStop(0,"#1e222b"),c.addColorStop(1,"#12151c"),a.fillStyle=c,a.fillRect(0,0,t,n)}else if(e.id==="black_shirt_hoodie"){let c=a.createLinearGradient(0,0,0,n);c.addColorStop(0,"#64748b"),c.addColorStop(1,"#334155"),a.fillStyle=c,a.fillRect(0,0,t,n)}else if(e.id==="fine_hair_bright_wall"){a.fillStyle="#f8fafc",a.fillRect(0,0,t,n);let c=a.createRadialGradient(t*.5,n*.3,20,t*.5,n*.3,t*.75);c.addColorStop(0,"#ffffff"),c.addColorStop(1,"#e2e8f0"),a.fillStyle=c,a.fillRect(0,0,t,n)}else if(e.id==="outdoor_night"){a.fillStyle="#0f172a",a.fillRect(0,0,t,n);let c=["rgba(251, 191, 36, 0.35)","rgba(56, 189, 248, 0.28)","rgba(244, 63, 94, 0.25)"];for(let g=0;g<14;g++)a.fillStyle=c[g%c.length],a.beginPath(),a.arc(g*73%(t-40)+20,g*53%(n*.65)+20,14+g%4*6,0,Math.PI*2),a.fill()}else if(e.id==="uneven_lighting_shadow"){let c=a.createLinearGradient(0,0,t,n);c.addColorStop(0,"#f1f5f9"),c.addColorStop(.55,"#cbd5e1"),c.addColorStop(1,"#475569"),a.fillStyle=c,a.fillRect(0,0,t,n),a.fillStyle="rgba(15, 23, 42, 0.42)",a.beginPath(),a.ellipse(t*.68,n*.62,t*.26,n*.32,.2,0,Math.PI*2),a.fill()}else if(e.id==="multi_person_distracting")a.fillStyle="#cbd5e1",a.fillRect(0,0,t,n),a.fillStyle="#475569",a.fillRect(14,30,58,76),a.fillStyle="#64748b",a.beginPath(),a.arc(42,n*.58,22,0,Math.PI*2),a.fill(),a.fillRect(16,n*.65,52,95);else{let c=a.createLinearGradient(0,0,0,n);c.addColorStop(0,"#94a3b8"),c.addColorStop(1,"#475569"),a.fillStyle=c,a.fillRect(0,0,t,n)}let f=document.createElement("canvas");f.width=t,f.height=n;let i=f.getContext("2d"),u=t*.5,r=n*.37,h=t*.19,m=n*.21;if(i.fillStyle=e.id==="dark_hair_dark_bg"||e.id==="black_shirt_hoodie"?"#0f1319":"#1e1b18",i.beginPath(),i.ellipse(u,r-8,h*1.16,m*1.12,0,0,Math.PI*2),i.fill(),e.id==="fine_hair_bright_wall"){i.strokeStyle="rgba(30, 27, 24, 0.65)",i.lineWidth=2.2;for(let c=-150;c<=-30;c+=8){let g=c*Math.PI/180,y=u+Math.cos(g)*h*1.05,k=r-8+Math.sin(g)*m*1.05;i.beginPath(),i.moveTo(y,k),i.quadraticCurveTo(y+Math.cos(g)*14,k+Math.sin(g)*10-6,y+Math.cos(g)*20,k+Math.sin(g)*18),i.stroke()}}let E=e.id==="black_shirt_hoodie"||e.id==="dark_hair_dark_bg"?"#0b0d12":e.id==="outdoor_night"?"#172554":"#1e293b";i.fillStyle=E,i.beginPath(),i.moveTo(u-t*.36,n),i.quadraticCurveTo(u-t*.35,n*.67,u-t*.14,n*.62),i.lineTo(u+t*.14,n*.62),i.quadraticCurveTo(u+t*.35,n*.67,u+t*.36,n),i.closePath(),i.fill(),e.id==="hands_fingers_gap"&&(i.lineWidth=26,i.lineCap="round",i.lineJoin="round",i.strokeStyle=E,i.beginPath(),i.moveTo(u+t*.25,n*.92),i.lineTo(u+t*.41,n*.75),i.lineTo(u+t*.28,n*.59),i.stroke(),i.fillStyle="#dca582",i.beginPath(),i.arc(u+t*.24,n*.57,13,0,Math.PI*2),i.fill()),i.fillStyle="#d49b78",i.fillRect(u-t*.08,n*.52,t*.16,n*.14),i.fillStyle=e.id==="black_shirt_hoodie"?"#181c24":"#f8fafc",i.beginPath(),i.moveTo(u-t*.09,n*.61),i.lineTo(u,n*.72),i.lineTo(u+t*.09,n*.61),i.closePath(),i.fill(),i.fillStyle="#d49b78",i.beginPath(),i.ellipse(u-h*.98,r+4,8,16,0,0,Math.PI*2),i.ellipse(u+h*.98,r+4,8,16,0,0,Math.PI*2),i.fill();let b=i.createRadialGradient(u-10,r-12,8,u,r,m*1.05);b.addColorStop(0,"#ecc0a1"),b.addColorStop(1,"#cfa17e"),i.fillStyle=b,i.beginPath(),i.ellipse(u,r,h,m,0,0,Math.PI*2),i.fill(),i.fillStyle=e.id==="dark_hair_dark_bg"||e.id==="black_shirt_hoodie"?"#0a0d12":"#1b1815",i.beginPath(),i.ellipse(u,r-m*.45,h*1.04,m*.62,0,Math.PI,0,!1),i.fill(),i.fillStyle="#1e293b",i.beginPath(),i.arc(u-h*.36,r-4,5,0,Math.PI*2),i.arc(u+h*.36,r-4,5,0,Math.PI*2),i.fill(),e.id==="glasses_portrait"&&(i.strokeStyle="#0f172a",i.lineWidth=3.2,i.strokeRect(u-h*.68,r-18,h*.56,26),i.strokeRect(u+h*.12,r-18,h*.56,26),i.beginPath(),i.moveTo(u-h*.12,r-6),i.lineTo(u+h*.12,r-6),i.stroke(),i.fillStyle="rgba(255, 255, 255, 0.26)",i.fillRect(u-h*.62,r-14,14,8),i.fillRect(u+h*.18,r-14,14,8)),i.fillStyle="#9f4a54",i.beginPath(),i.ellipse(u,r+m*.46,15,6.5,0,0,Math.PI*2),i.fill();let l=i.getImageData(0,0,t,n).data,p=new Uint8Array(t*n);for(let c=0;c<t*n;c++)p[c]=l[c*4+3];a.drawImage(f,0,0);let x=s.toDataURL("image/png"),v=await Qe(x);return{scenario:e,sourceDataUrl:x,sourceImage:v,groundTruthAlpha:p}}function J(o,e,t){let n=t>0?t:300;switch(e){case"px":return Math.round(o);case"in":return Number((o/n).toFixed(2));case"cm":return Number((o/n*2.54).toFixed(2));case"mm":return Number((o/n*25.4).toFixed(1))}}function $e(o,e,t){let n=t==="high"?2:t==="low"?.75:1;return{outWidth:Math.max(16,Math.round(o*n)),outHeight:Math.max(16,Math.round(e*n)),scaleFactor:n}}function et(o){switch(o){case"image/jpeg":return"JPG";case"image/png":return"PNG";case"image/webp":return"WebP"}}function Fe(o,e,t){let n=o.widthPx===t.widthPx&&o.heightPx===t.heightPx,s=t.defaultBg==="white"?o.bgTone==="white"||o.bgTone==="grey"||o.bgTone==="blue":!0,a=e<=o.targetCapKb&&e>=1,f=Math.abs(o.rotationDeg)<=10,i=o.format==="image/jpeg"||o.format==="image/png"||o.format==="image/webp",u=o.bgTone==="white"?"Plain white background (No attestation/writing)":o.bgTone==="blue"?"Solid Sky Blue studio background":o.bgTone==="grey"?"Neutral studio off-white background":"Clean isolated background",r=[{id:"dims",label:`Dimensions exactly ${o.widthPx} \xD7 ${o.heightPx} pixels (${n?"Passed":"Custom"})`,passed:!0},{id:"bg",label:`${u} (${s?"Passed":"Review"})`,passed:s},{id:"cap",label:`File size strictly within ${o.targetCapKb} KB cap (Current: ${e.toFixed(1)} KB) (${a?"Passed":"Over Cap"})`,passed:a},{id:"biometric",label:o.mode==="signature"?`High-contrast signature ink clarity (${f?"Passed":"Tilted"})`:`Recent color photo (taken within 3 months) (${f?"Passed":"Tilted"})`,passed:f},{id:"format",label:`Baseline ${et(o.format)} format ${o.stripExif?"with EXIF stripped":"encoded"} (${i?"Passed":"Review"})`,passed:i}],h=r.filter(m=>m.passed).length;return{checks:r,passedCount:h,totalCount:r.length,allPassed:h===r.length}}function He(o,e,t,n,s,a,f){let i=o*s,u=e*a,r=s/2+f.offsetX/300*s,h=a/2+f.offsetY/350*a,m=i-r,E=u-h,b=-f.rotationDeg*Math.PI/180,l=Math.cos(b),p=Math.sin(b),x=m*l-E*p,v=m*p+E*l,c=Math.max(.05,f.scalePct/100),g=f.flipH?-c:c,y=f.flipV?-c:c,k=x/g,P=v/y,d=t/Math.max(1,n),w=s/Math.max(1,a),M=s,C=a;f.mode==="signature"?d>w?(M=s*.94,C=M/d):(C=a*.88,M=C*d):d>w?(C=a,M=a*d):(M=s,C=s/d);let S=(k+M/2)/Math.max(1,M),T=(P+C/2)/Math.max(1,C);return S<0||S>1||T<0||T>1?null:{normX:S,normY:T}}function Z(o,e,t,n,s,a,f){o.save(),o.translate(s/2+f.offsetX/300*s,a/2+f.offsetY/350*a),o.rotate(f.rotationDeg*Math.PI/180);let i=f.scalePct/100;o.scale(f.flipH?-i:i,f.flipV?-i:i);let u=t/Math.max(1,n),r=s/Math.max(1,a),h=s,m=a;f.mode==="signature"?u>r?(h=s*.94,m=h/u):(m=a*.88,h=m*u):u>r?(m=a,h=a*u):(h=s,m=s/u),o.drawImage(e,0,0,t,n,-h/2,-m/2,h,m),o.restore()}function je(o,e,t=null){let{outWidth:n,outHeight:s}=$e(o.widthPx,o.heightPx,o.resolutionTier);if(!!!(e&&e.complete&&e.naturalWidth>0)||!e)return{dataUrl:"",sizeBytes:0,sizeKb:0,outWidth:n,outHeight:s,qualityUsed:o.qualityPct,hasSourceImage:!1,usedNeuralMatte:!1,isPreClippedAlpha:!1};let f=document.createElement("canvas");f.width=n,f.height=s;let i=f.getContext("2d");if(!i)return{dataUrl:"",sizeBytes:0,sizeKb:0,outWidth:n,outHeight:s,qualityUsed:o.qualityPct,hasSourceImage:!1,usedNeuralMatte:!1,isPreClippedAlpha:!1};let u=o.bgTone==="custom"?o.customBgColor:se[o.bgTone];u!=="transparent"||o.format==="image/jpeg"?(i.fillStyle=u==="transparent"?"#ffffff":u,i.fillRect(0,0,n,s)):i.clearRect(0,0,n,s);let r=!1,h=!!(t&&t.sourceSrc===e.src&&t.isPreClippedAlpha);if(o.mode==="signature"){let x=document.createElement("canvas");x.width=n,x.height=s;let v=x.getContext("2d");if(v){Z(v,e,e.naturalWidth,e.naturalHeight,n,s,o);let c=v.getImageData(0,0,n,s);Ee(c.data,n,s,o.bgRemovalEnabled,o.sigThreshold,o.sigInkColorMode??(o.sigHighContrast?"mono":"original"),24),v.putImageData(c,0,0),i.drawImage(x,0,0)}}else if(t&&t.sourceSrc===e.src&&(o.bgRemovalEnabled||t.isPreClippedAlpha)){r=!0;let x=o.bgChokePx??0,v=o.bgFeather??0;if(x===0&&v===0)Z(i,t.maskCanvas,t.width,t.height,n,s,o);else{let c=document.createElement("canvas");c.width=n,c.height=s;let g=c.getContext("2d");if(g){Z(g,e,e.naturalWidth,e.naturalHeight,n,s,o);let y=g.getImageData(0,0,n,s),k=document.createElement("canvas");k.width=n,k.height=s;let P=k.getContext("2d");if(P){Z(P,t.maskCanvas,t.width,t.height,n,s,o);let d=P.getImageData(0,0,n,s),w=n*s,M=new Uint8Array(w);for(let C=0;C<w;C++)M[C]=d.data[C*4+3];Be(y.data,M,n,s,x,v),g.putImageData(y,0,0)}i.drawImage(c,0,0)}}}else Z(i,e,e.naturalWidth,e.naturalHeight,n,s,o);if(o.showMaskOverlay&&o.mode==="photo"&&t&&t.sourceSrc===e.src){let x=document.createElement("canvas");x.width=n,x.height=s;let v=x.getContext("2d");if(v){Z(v,t.maskCanvas,t.width,t.height,n,s,o);let c=v.getImageData(0,0,n,s).data,g=i.getImageData(0,0,n,s),y=g.data,k=n*s;for(let P=0;P<k;P++){let d=P*4,w=c[d+3];w<20?(y[d]=Math.round(y[d]*.45+225*.55),y[d+1]=Math.round(y[d+1]*.45+29*.55),y[d+2]=Math.round(y[d+2]*.45+72*.55),y[d+3]=255):w<235?(y[d]=Math.round(y[d]*.4+56*.6),y[d+1]=Math.round(y[d+1]*.4+189*.6),y[d+2]=Math.round(y[d+2]*.4+248*.6),y[d+3]=255):(y[d]=Math.round(y[d]*.84+16*.16),y[d+1]=Math.round(y[d+1]*.84+185*.16),y[d+2]=Math.round(y[d+2]*.84+129*.16),y[d+3]=255)}i.putImageData(g,0,0)}}let m=o.targetCapKb*1024,E="",b=o.qualityPct/100;if(o.format==="image/png")E=f.toDataURL("image/png");else{let x=.1,v=Math.min(.98,Math.max(.25,o.qualityPct/100));if(E=f.toDataURL(o.format,v),ge(E)>m)for(let g=0;g<7;g++){let y=(x+v)/2,k=f.toDataURL(o.format,y);ge(k)<=m?(E=k,b=y,x=y):v=y}}let l=ge(E),p=Math.max(.5,Number((l/1024).toFixed(1)));return{dataUrl:E,sizeBytes:l,sizeKb:p,outWidth:n,outHeight:s,qualityUsed:Math.round(b*100),hasSourceImage:!0,usedNeuralMatte:r,isPreClippedAlpha:h}}function ge(o){let e=o.indexOf(",");if(e===-1)return 0;let t=o.length-(e+1);return Math.round(t*3/4)}async function Oe(o,e,t,n,s,a){let u=document.createElement("canvas");u.width=1240,u.height=1754;let r=u.getContext("2d");if(!r)return;r.fillStyle="#ffffff",r.fillRect(0,0,1240,1754),r.fillStyle="#0f172a",r.fillRect(60,52,1120,74),r.fillStyle="#ffffff",r.font="bold 24px sans-serif",r.fillText(`FormPhoto Pro \u2014 A4 Calibrated Admission Print Sheet (${s.shortName})`,84,86);let h=J(e,"mm",n.dpi),m=J(t,"mm",n.dpi);r.fillStyle="#94a3b8",r.font="15px monospace",r.fillText(`Spec: ${e}\xD7${t} px (${h}\xD7${m} mm @ ${n.dpi} DPI) \u2022 Cap: <=${n.targetCapKb} KB \u2022 A4 (210\xD7297 mm)`,84,110);let E=await new Promise((S,T)=>{let I=new Image;I.onload=()=>S(I),I.onerror=A=>T(A),I.src=o}),b=1240/210,l=Math.max(110,Math.min(320,Math.round(h*b*(n.mode==="signature"?1.5:1.15)))),p=Math.max(55,Math.round(l*(t/Math.max(1,e)))),x=76,v=164,c=28,g=34,y=Math.max(1,Math.min(4,Math.floor((1240-x*2+c)/(l+c)))),k=Math.max(1,Math.min(5,Math.floor((1754-v-120+g)/(p+g))));for(let S=0;S<k;S++)for(let T=0;T<y;T++){let I=x+T*(l+c),A=v+S*(p+g);r.drawImage(E,I,A,l,p),r.strokeStyle="#cbd5e1",r.lineWidth=1,r.strokeRect(I,A,l,p),r.strokeStyle="#475569",r.lineWidth=1.5;let D=8;r.beginPath(),r.moveTo(I-D,A),r.lineTo(I-2,A),r.moveTo(I,A-D),r.lineTo(I,A-2),r.moveTo(I+l+2,A),r.lineTo(I+l+D,A),r.moveTo(I+l,A-D),r.lineTo(I+l,A-2),r.moveTo(I-D,A+p),r.lineTo(I-2,A+p),r.moveTo(I,A+p+2),r.lineTo(I,A+p+D),r.moveTo(I+l+2,A+p),r.lineTo(I+l+D,A+p),r.moveTo(I+l,A+p+2),r.lineTo(I+l,A+p+D),r.stroke()}r.fillStyle="#475569",r.font="13px monospace",r.fillText(`Generated 100% On-Device by FormPhoto Pro \u2022 ${y*k} calibrated copies \u2022 Print at 100% scale on A4 paper`,x,1706);let P=u.toDataURL("image/jpeg",.94),d=tt(P,1240,1754),w=new Blob([d],{type:"application/pdf"}),M=URL.createObjectURL(w),C=document.createElement("a");C.href=M,C.download=a,document.body.appendChild(C),C.click(),document.body.removeChild(C),window.setTimeout(()=>URL.revokeObjectURL(M),2500)}function tt(o,e,t){let n=o.split(",")[1]||"",s=atob(n),a=new Uint8Array(s.length);for(let c=0;c<s.length;c++)a[c]=s.charCodeAt(c);let f=595.28,i=841.89,u=`q
${f} 0 0 ${i} 0 0 cm
/Im0 Do
Q
`,r=new TextEncoder,h=[],m=[0],E=0,b=c=>{let g=r.encode(c);h.push(g),E+=g.length},l=c=>{h.push(c),E+=c.length};b(`%PDF-1.4
%\xFF\xFF\xFF\xFF
`),m[1]=E,b(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`),m[2]=E,b(`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
`),m[3]=E,b(`3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f} ${i}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>
endobj
`),m[4]=E,b(`4 0 obj
<< /Type /XObject /Subtype /Image /Width ${e} /Height ${t} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${a.length} >>
stream
`),l(a),b(`
endstream
endobj
`),m[5]=E,b(`5 0 obj
<< /Length ${u.length} >>
stream
${u}endstream
endobj
`);let p=E;b(`xref
0 6
0000000000 65535 f 
`);for(let c=1;c<=5;c++){let g=String(m[c]).padStart(10,"0");b(`${g} 00000 n 
`)}b(`trailer
<< /Size 6 /Root 1 0 R >>
startxref
${p}
%%EOF
`);let x=new Uint8Array(E),v=0;for(let c of h)x.set(c,v),v+=c.length;return x}var nt={mode:"photo",presetId:"buet",widthPx:300,heightPx:350,unit:"px",dpi:300,aspectRatioLock:"6:7",rotationDeg:0,scalePct:100,offsetX:0,offsetY:0,flipH:!1,flipV:!1,bgTone:"white",customBgColor:"#dbeafe",bgRemovalEnabled:!0,bgTolerance:30,bgChokePx:0,bgFeather:0,sigHighContrast:!1,sigInkColorMode:"original",sigThreshold:14,format:"image/jpeg",formatExtLabel:"JPG",targetCapKb:75,qualityPct:90,resolutionTier:"standard",stripExif:!0,viewMode:"single",zoomPct:100,showGrid:!0,showMaskOverlay:!1,splitPositionPct:50,theme:"warm"},oe=["warm","oled","light","gray"];function at(o,e){if(!o)return;let t=document.createElement("a");t.href=o,t.download=e,document.body.appendChild(t),t.click(),document.body.removeChild(t)}var be=class{constructor(){this.state={...nt};this.activeStep="photo";this.rawImageEl=null;this.rawImageBlob=null;this.neuralModelTier="rmbg_14";this.brushMode="off";this.brushSizePx=22;this.selectedBenchmarkScenario="black_shirt_hoodie";this.benchmarkBgKey="white";this.lastBenchmarkComparison=null;this.customUploadedFile=null;this.lastResult=null;this.exportHistory=[];this.toastTimer=null;this.renderDebounceTimer=null;this.isDraggingCanvas=!1;this.dragStart={x:0,y:0,offsetX:0,offsetY:0}}init(){this.applyThemeClass(this.state.theme),this.mountInitialShell(),Ie(e=>{this.syncNeuralProgressUI(e),this.syncRuntimeDiagnosticsPanel()}),this.runPipelineAndSyncUI()}applyThemeClass(e){let t=document.documentElement;oe.forEach(n=>t.classList.remove(`theme-${n}`)),t.classList.add(`theme-${e}`),t.setAttribute("data-theme",e)}getAllPresetsList(){return ye.map(e=>W[e]).filter(Boolean)}getActivePreset(){return W[this.state.presetId]||W.buet}showToast(e){let t=document.getElementById("m3-toast-banner"),n=document.getElementById("m3-toast-text");t&&n&&(n.textContent=e,t.classList.remove("opacity-0","pointer-events-none","translate-y-4"),t.classList.add("opacity-100","translate-y-0")),this.toastTimer&&window.clearTimeout(this.toastTimer),this.toastTimer=window.setTimeout(()=>{let s=document.getElementById("m3-toast-banner");s&&(s.classList.add("opacity-0","pointer-events-none","translate-y-4"),s.classList.remove("opacity-100","translate-y-0"))},3200)}triggerNeuralMattingIfNeeded(e=!1){if(!(!this.rawImageEl||this.state.mode!=="photo"||!this.state.bgRemovalEnabled)){if(!e&&ae(this.rawImageEl,this.neuralModelTier)){this.runPipelineAndSyncUI();return}Ne(this.rawImageEl,this.rawImageBlob,this.neuralModelTier,()=>{this.runPipelineAndSyncUI()},e)}}syncNeuralProgressUI(e){let t=document.getElementById("neural-stage-label"),n=document.getElementById("neural-progress-bar"),s=document.getElementById("neural-idb-badge"),a=document.getElementById("canvas-neural-loading-pill"),f=document.getElementById("canvas-neural-loading-text"),i=document.getElementById("step1-bg-status");if(t&&(t.textContent=e.stageLabel),n){let u=e.status==="idle"||e.status==="ready"||e.status==="preclipped"?100:Math.max(5,Math.min(100,e.progressPct));n.style.width=`${u}%`}if(s&&(s.textContent=e.status==="downloading"||e.status==="inferring"?`${e.progressPct}%`:e.status==="preclipped"?"PRE-CLIPPED":e.status==="ready"?"ACTIVE":e.status==="error"?"RETRY":"READY"),i&&(e.status==="inferring"||e.status==="downloading"?(i.textContent="Removing Background\u2026",i.className="text-[11px] font-mono font-bold text-amber-500 animate-pulse"):e.status==="preclipped"?(i.textContent="Pre-Clipped PNG (Ready)",i.className="text-[11px] font-mono font-bold text-emerald-600"):this.state.bgRemovalEnabled?(i.textContent="Background Removed Automatically",i.className="text-[11px] font-mono font-bold text-emerald-600"):(i.textContent="Original Background Kept",i.className="text-[11px] font-mono m3-text-muted")),a&&f){let u=this.state.mode==="photo"&&this.state.bgRemovalEnabled&&!!this.rawImageEl&&(e.status==="downloading"||e.status==="inferring");a.classList.toggle("hidden",!u),a.classList.toggle("flex",u),u&&(f.textContent=`${e.stageLabel}`)}}syncRuntimeDiagnosticsPanel(){let e=Te(),t=ae(this.rawImageEl,this.neuralModelTier),n=(r,h)=>{let m=document.getElementById(r);m&&(m.textContent=h)};n("diag-model-id",`${e.activeModelId}`),n("diag-model-version",e.modelVersion),n("diag-backend",e.inferenceBackend),n("diag-status",e.status.toUpperCase()),n("diag-duration",e.inferenceDurationMs>0?`${e.inferenceDurationMs} ms`:"\u2014"),n("diag-source-dims",e.sourceWidth>0?`${e.sourceWidth}\xD7${e.sourceHeight}`:"\u2014");let s=document.getElementById("diag-error-box"),a=document.getElementById("diag-error-text");s&&a&&(e.errorMessage?(s.classList.remove("hidden"),a.textContent=e.errorMessage):(s.classList.add("hidden"),a.textContent=""));let f=t?.diagnostics.refinedDiagnostics??e.refinedDiagnostics;f?(n("diag-speckles",String(f.backgroundSpeckleCount)),n("diag-holes",String(f.foregroundHoleCount)),n("diag-smoothness",`${f.boundarySmoothnessPct}%`)):(n("diag-speckles","\u2014"),n("diag-holes","\u2014"),n("diag-smoothness","\u2014"));let i=document.getElementById("btn-brush-undo"),u=document.getElementById("btn-brush-redo");i&&(i.disabled=!he(),i.classList.toggle("opacity-40",!he())),u&&(u.disabled=!fe(),u.classList.toggle("opacity-40",!fe()))}schedulePipelineUpdate(e=!1){if(this.renderDebounceTimer&&window.clearTimeout(this.renderDebounceTimer),e){this.runPipelineAndSyncUI();return}this.renderDebounceTimer=window.setTimeout(()=>{this.runPipelineAndSyncUI()},16)}runPipelineAndSyncUI(){let e=ae(this.rawImageEl,this.neuralModelTier),t=this.state.mode==="photo"&&e&&(this.state.bgRemovalEnabled||e.isPreClippedAlpha)?e:null,n=je(this.state,this.rawImageEl,t);this.lastResult=n,this.syncDynamicDOM(n),this.syncRuntimeDiagnosticsPanel()}handleLocalFileUpload(e,t="Loaded"){if(!e.type.startsWith("image/")){this.showToast("Please select or paste a valid image (JPG, PNG, WebP).");return}this.customUploadedFile?.url&&URL.revokeObjectURL(this.customUploadedFile.url),me(),this.rawImageBlob=e;let n=URL.createObjectURL(e),s=new Image;s.onload=()=>{if(this.customUploadedFile={name:e.name||"Cutout.png",sizeKb:Math.max(.5,Math.round(e.size/1024*10)/10),width:s.naturalWidth||600,height:s.naturalHeight||700,url:n},this.rawImageEl=s,this.setWorkflowStep("adjust"),this.state.mode==="photo"&&pe(s,this.neuralModelTier)){this.runPipelineAndSyncUI(),this.showToast("Transparent PNG Cutout Loaded \u2014 Background Studio Ready!");return}this.runPipelineAndSyncUI(),this.triggerNeuralMattingIfNeeded(),this.showToast(`${t} "${this.customUploadedFile.name}" (${this.customUploadedFile.width}\xD7${this.customUploadedFile.height} px).`)},s.onerror=()=>{this.showToast("Could not decode that image file in browser.")},s.src=n}async loadBenchmarkScenarioIntoEditor(e){let t=await _e(e),s=await(await fetch(t.sourceDataUrl)).blob(),a=new File([s],`${e}.png`,{type:"image/png"});this.handleLocalFileUpload(a,"Benchmark")}async handleClipboardPasteButton(){try{if(!navigator.clipboard||typeof navigator.clipboard.read!="function"){this.showToast("Press Ctrl+V (or Cmd+V) anywhere to paste your photo.");return}let e=await navigator.clipboard.read();for(let t of e){let n=t.types.find(s=>s.startsWith("image/"));if(n){let s=await t.getType(n),a=n.split("/")[1]||"png",f=new File([s],`Pasted_Photo.${a}`,{type:n});this.handleLocalFileUpload(f,"Pasted");return}}this.showToast("No image found in clipboard. Copy a photo or phone cutout first.")}catch{this.showToast("Press Ctrl+V (or long-press Paste) to paste your photo.")}}clearUploadedImage(){this.customUploadedFile?.url&&URL.revokeObjectURL(this.customUploadedFile.url),me(),this.customUploadedFile=null,this.rawImageEl=null,this.rawImageBlob=null,this.brushMode="off",this.setWorkflowStep("photo"),this.runPipelineAndSyncUI(),this.showToast("Cleared image from studio.")}applyPreset(e){this.state.presetId=e.id,this.state.mode=e.mode,this.state.widthPx=e.widthPx,this.state.heightPx=e.heightPx,this.state.aspectRatioLock=e.ratioLabel,this.state.targetCapKb=e.maxKb,this.state.dpi=e.dpi,this.state.bgTone=e.defaultBg,this.state.scalePct=100,this.state.offsetX=0,this.state.offsetY=0,this.state.rotationDeg=0,this.schedulePipelineUpdate(!0),this.triggerNeuralMattingIfNeeded(),this.showToast(`Preset: ${e.shortName} (${e.widthPx}\xD7${e.heightPx} px \u2022 \u2264${e.maxKb} KB)`)}handleExportCurrentFile(){if(!this.rawImageEl){document.getElementById("local-file-input")?.click(),this.showToast("Please select or take a photo first.");return}let e=this.state.showMaskOverlay;if(this.state.showMaskOverlay=!1,this.runPipelineAndSyncUI(),this.state.showMaskOverlay=e,!this.lastResult||!this.lastResult.dataUrl)return;let t=this.getActivePreset(),n=this.state.formatExtLabel.toLowerCase(),s=this.state.resolutionTier==="low"?"_lowres":this.state.resolutionTier==="high"?"_highres_300dpi":"",f=`FormPhoto_${t.id.replace(/[^a-z0-9_-]/gi,"_")}_${this.lastResult.outWidth}x${this.lastResult.outHeight}${s}.${n}`;at(this.lastResult.dataUrl,f);let i={id:`${Date.now()}`,presetName:t.shortName,filename:f,width:this.lastResult.outWidth,height:this.lastResult.outHeight,sizeKb:this.lastResult.sizeKb,formatLabel:this.state.formatExtLabel,resolutionTier:this.state.resolutionTier,timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),dataUrl:this.lastResult.dataUrl};this.exportHistory.unshift(i),this.exportHistory.length>3&&this.exportHistory.pop(),this.renderExportHistoryStrip(),e&&this.runPipelineAndSyncUI(),this.showToast(`Downloaded ${f} (${this.lastResult.sizeKb} KB) successfully!`)}async handleExportA4PdfSheet(){if(!this.rawImageEl){document.getElementById("local-file-input")?.click(),this.showToast("Upload a photo first to generate the A4 print sheet.");return}let e=this.state.showMaskOverlay;if(this.state.showMaskOverlay=!1,this.runPipelineAndSyncUI(),this.state.showMaskOverlay=e,!this.lastResult||!this.lastResult.dataUrl)return;let t=this.getActivePreset(),s=`FormPhoto_${t.id.replace(/[^a-z0-9_-]/gi,"_")}_A4_Print_Sheet.pdf`;try{this.showToast("Generating calibrated A4 PDF print sheet\u2026"),await Oe(this.lastResult.dataUrl,this.lastResult.outWidth,this.lastResult.outHeight,this.state,t,s),e&&this.runPipelineAndSyncUI(),this.showToast("Downloaded calibrated A4 PDF print sheet!")}catch(a){console.error("A4 PDF generation failed:",a),this.showToast("Could not generate A4 PDF sheet.")}}setWorkflowStep(e){this.activeStep=e,["photo","adjust","export"].forEach(n=>{let s=document.getElementById(`tab-step-${n}`),a=document.getElementById(`nav-mobile-${n}`),f=document.getElementById(`panel-step-${n}`),i=n===e;s&&(s.className=`step-nav-btn m3-spring flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${i?"m3-primary shadow-sm":"m3-surface-2 hover:m3-surface-3 m3-text-muted hover:text-m3-text"}`),a&&(a.className=`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition ${i?"text-[var(--m3-primary)]":"text-[var(--m3-text-muted)] hover:text-[var(--m3-text)]"}`),f&&(f.classList.toggle("hidden",!i),f.classList.toggle("flex",i))})}applyTouchUpBrushAtPointer(e,t){if(this.brushMode==="off"||!this.rawImageEl||!this.lastResult||this.state.mode!=="photo")return;let n=document.getElementById("calibrated-frame-wrap");if(!n)return;let s=n.getBoundingClientRect();if(s.width<=0||s.height<=0)return;let a=(e-s.left)/s.width,f=(t-s.top)/s.height,i=ae(this.rawImageEl,this.neuralModelTier);if(!i)return;let u=He(a,f,i.width,i.height,this.lastResult.outWidth,this.lastResult.outHeight,this.state);if(!u)return;let r=Math.max(i.width,i.height)/Math.max(1,Math.max(s.width,s.height)),h=Math.max(2,this.brushSizePx/2*r*(100/Math.max(25,this.state.scalePct)));De(u.normX,u.normY,h,this.brushMode)&&this.schedulePipelineUpdate()}mountInitialShell(){let e=document.getElementById("root");if(!e)return;let t=this.getAllPresetsList(),n=Ae();e.innerHTML=`
      <!-- Hidden Native File Input (100% On-Device Browser Processing) -->
      <input id="local-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/*" class="hidden" />

      <!-- FIXED APPLICATION SHELL: Header (52px) + Main Content (100dvh - 52px) -->
      <div class="h-[100dvh] w-full flex flex-col overflow-hidden bg-[var(--m3-bg)] text-[var(--m3-text)]">
        
        <!-- COMPACT HEADER TOOLBAR (Fixed 52px) -->
        <header class="w-full h-[52px] px-3 sm:px-4 border-b border-[var(--m3-outline-variant)] m3-surface-1 flex items-center justify-between gap-2 shrink-0 z-40 select-none">
          
          <!-- Left: Studio Logo + Portal Preset Trigger Pill -->
          <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <div class="w-8 h-8 rounded-xl m3-primary flex items-center justify-center shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[19px]">crop_free</span>
            </div>
            <span class="hidden sm:inline font-display font-bold text-sm sm:text-base tracking-tight shrink-0">FormPhoto</span>
            
            <!-- Current Portal Preset Pill (Click to Change) -->
            <button id="btn-open-portal-popup" type="button" class="m3-spring flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-xs font-semibold shrink" title="Change Portal Preset">
              <span class="material-symbols-outlined text-m3-primary text-[15px] shrink-0">school</span>
              <span id="header-portal-label" class="font-bold truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[180px]">BUET Engineering</span>
              <span class="material-symbols-outlined text-[14px] m3-text-muted shrink-0">expand_more</span>
            </button>
          </div>

          <!-- Center: 3-Step Student Journey Navigation Tabs (Desktop & Tablet) -->
          <nav class="hidden md:flex items-center gap-1 bg-[var(--m3-surface-2)] p-1 rounded-full border border-[var(--m3-outline-variant)]">
            <button id="tab-step-photo" type="button" class="step-nav-btn m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition m3-primary">
              <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>Photo</span>
            </button>
            <button id="tab-step-adjust" type="button" class="step-nav-btn m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition m3-text-muted hover:text-m3-text">
              <span class="w-4 h-4 rounded-full bg-black/15 flex items-center justify-center text-[10px]">2</span>
              <span>Adjust</span>
            </button>
            <button id="tab-step-export" type="button" class="step-nav-btn m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition m3-text-muted hover:text-m3-text">
              <span class="w-4 h-4 rounded-full bg-black/15 flex items-center justify-center text-[10px]">3</span>
              <span>Export</span>
            </button>
          </nav>

          <!-- Right: Mode Switcher (Photo/Signature) + Theme Picker + Info -->
          <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <!-- Mode switch -->
            <div class="flex items-center bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] text-xs font-bold">
              <button id="mode-btn-photo" type="button" class="px-2 sm:px-2.5 py-1 rounded-full transition m3-primary" title="Admission Photo Mode">Photo</button>
              <button id="mode-btn-signature" type="button" class="px-2 sm:px-2.5 py-1 rounded-full transition m3-text-muted hover:text-m3-text" title="Signature Isolation Mode">Sig</button>
            </div>

            <!-- Mobile Single Theme Toggle -->
            <button id="btn-mobile-theme-toggle" type="button" class="sm:hidden w-7 h-7 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] flex items-center justify-center text-xs" title="Switch Theme">
              <span class="material-symbols-outlined text-[15px]">contrast</span>
            </button>

            <!-- Theme Picker (Desktop/Tablet) -->
            <div id="theme-switcher-bar" class="hidden sm:flex items-center bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] gap-0.5">
              ${oe.map(s=>{let a=xe[s];return`
                  <button
                    type="button"
                    data-theme="${s}"
                    class="theme-pill w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-xs transition"
                    title="${a.name}: ${a.subtitle}"
                  >
                    <span class="material-symbols-outlined text-[14px] sm:text-[15px]">${a.icon}</span>
                  </button>
                `}).join("")}
            </div>

            <!-- Info / Privacy -->
            <button id="btn-privacy-badge" type="button" class="hidden xs:flex w-7 sm:w-8 h-7 sm:h-8 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] items-center justify-center text-emerald-500" title="100% On-Device Privacy \u2014 Zero Cloud Upload">
              <span class="material-symbols-outlined text-[16px] sm:text-[18px]">lock</span>
            </button>
          </div>
        </header>

        <!-- MAIN WORKSPACE: Sidebar + Canvas Stage (Fills Remaining Viewport Without Whole-Page Scroll) -->
        <main class="flex-1 w-full min-h-0 flex flex-col md:flex-row overflow-hidden relative">
          
          <!-- LEFT EDITING SIDEBAR (Desktop: Scrollable Sidebar \u2022 Mobile: Bottom Panel Driven by Tabs) -->
          <aside class="w-full md:w-[340px] lg:w-[370px] h-auto md:h-full shrink-0 border-b md:border-b-0 md:border-r border-[var(--m3-outline-variant)] m3-surface-1 p-3 sm:p-4 overflow-y-auto min-h-0 flex flex-col gap-3.5 z-20 order-2 md:order-1">
            
            <!-- ================= STEP 1: PHOTO PANEL ================= -->
            <div id="panel-step-photo" class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-bold text-sm uppercase tracking-wide text-m3-text flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full m3-primary flex items-center justify-center text-[10px]">1</span>
                  <span>Upload &amp; Portal</span>
                </h3>
                <span id="step1-bg-status" class="text-[11px] font-mono font-bold text-emerald-600">Background Removed Automatically</span>
              </div>

              <!-- Big Primary Upload Button -->
              <button id="btn-sidebar-upload" type="button" class="w-full py-3.5 px-4 rounded-2xl m3-primary font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition">
                <span class="material-symbols-outlined text-[20px]">upload_file</span>
                <span id="btn-sidebar-upload-label">Upload Passport Photo</span>
              </button>

              <div class="flex items-center gap-2">
                <button id="btn-sidebar-paste" type="button" class="flex-1 py-2 px-3 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-semibold text-xs flex items-center justify-center gap-1.5 transition">
                  <span class="material-symbols-outlined text-[16px]">content_paste_go</span>
                  <span>Paste (Ctrl+V)</span>
                </button>
                <button id="btn-step1-change-portal" type="button" class="flex-1 py-2 px-3 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-semibold text-xs flex items-center justify-center gap-1.5 transition">
                  <span class="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Change Portal</span>
                </button>
              </div>

              <!-- Selected Portal Card Summary -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-m3-text" id="summary-portal-name">BUET Engineering</span>
                  <span class="font-mono text-[10px] px-2 py-0.5 rounded-full m3-primary-container font-bold" id="summary-portal-ratio">6:7</span>
                </div>
                <div class="text-[11px] m3-text-muted" id="summary-portal-note">300\xD7350 px \u2022 \u2264 75 KB limit \u2022 Plain white background.</div>
                <div class="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[var(--m3-outline-variant)]">
                  <span>Target: <strong id="summary-portal-dims">300 \xD7 350 px</strong></span>
                  <span>Max File: <strong id="summary-portal-maxkb">\u2264 75 KB</strong></span>
                </div>
              </div>

              <!-- Background Cutout On/Off Toggle -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex items-center justify-between">
                <div>
                  <div class="font-bold text-xs">Automatic Background Removal</div>
                  <div class="text-[11px] m3-text-muted">On-device neural matting for studio cutouts</div>
                </div>
                <button id="btn-toggle-bg-remove" type="button" class="m3-spring px-3 py-1 rounded-full m3-primary font-mono font-bold text-[11px]">
                  <span id="bg-remove-status-text">ON</span>
                </button>
              </div>

              <button id="btn-goto-step-adjust" type="button" class="w-full py-2.5 px-3 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-bold text-xs flex items-center justify-center gap-1 transition">
                <span>Continue to Step 2: Adjust Photo</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <!-- ================= STEP 2: ADJUST PANEL ================= -->
            <div id="panel-step-adjust" class="hidden flex-col gap-3">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-bold text-sm uppercase tracking-wide text-m3-text flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full m3-primary flex items-center justify-center text-[10px]">2</span>
                  <span>Adjust &amp; Backdrop</span>
                </h3>
                <button id="btn-reset-crop" type="button" class="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[14px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              </div>

              <!-- 1. Studio Backdrop Fill Colors -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold">Studio Backdrop Color</span>
                  <span id="val-bg-tone-label" class="font-mono text-[10px] m3-text-muted">White (#fff)</span>
                </div>
                <div class="flex items-center justify-between gap-1.5">
                  <button type="button" data-bgtone="white" class="bg-swatch w-7 h-7 rounded-full bg-white border border-stone-400 transition hover:scale-110 ring-2 ring-[var(--m3-primary)]" title="Pure White (#ffffff) \u2014 BUET & DGME standard"></button>
                  <button type="button" data-bgtone="blue" class="bg-swatch w-7 h-7 rounded-full bg-[#38bdf8] border border-white transition hover:scale-110" title="Sky Blue (#38bdf8) \u2014 NEET/JEE & Passport"></button>
                  <button type="button" data-bgtone="grey" class="bg-swatch w-7 h-7 rounded-full bg-slate-200 border border-white transition hover:scale-110" title="Off-White (#e2e8f0)"></button>
                  <button type="button" data-bgtone="midgrey" class="bg-swatch w-7 h-7 rounded-full bg-[#808080] border border-stone-300 transition hover:scale-110" title="Mid-Grey (#808080)"></button>
                  <button type="button" data-bgtone="black" class="bg-swatch w-7 h-7 rounded-full bg-black border border-stone-500 transition hover:scale-110" title="Pitch Black (#000000)"></button>
                  <button type="button" data-bgtone="alpha" class="bg-swatch w-7 h-7 rounded-full checker-bg border border-stone-400 transition hover:scale-110" title="Transparent Alpha (PNG)"></button>
                  <label class="w-7 h-7 rounded-full overflow-hidden border border-stone-400 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 hover:scale-110 transition" title="Custom Backdrop Color">
                    <input id="input-custom-bg-color" type="color" value="#dbeafe" class="opacity-0 w-0 h-0" />
                  </label>
                </div>
              </div>

              <!-- 2. Crop, Zoom, Pan & Rotate Sliders -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-zoom" class="text-xs font-semibold">Face Size / Zoom</label>
                    <span id="val-zoom" class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded m3-surface-2">100%</span>
                  </div>
                  <input id="slider-zoom" type="range" min="50" max="240" value="100" class="m3-slider" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label for="slider-pan-x" class="text-[11px] font-medium m3-text-muted">Pan Horizontal</label>
                      <span id="val-pan-x" class="font-mono text-[10px]">0</span>
                    </div>
                    <input id="slider-pan-x" type="range" min="-120" max="120" value="0" class="m3-slider" />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label for="slider-pan-y" class="text-[11px] font-medium m3-text-muted">Pan Vertical</label>
                      <span id="val-pan-y" class="font-mono text-[10px]">0</span>
                    </div>
                    <input id="slider-pan-y" type="range" min="-120" max="120" value="0" class="m3-slider" />
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-rotation" class="text-[11px] font-medium m3-text-muted">Straighten / Rotate</label>
                    <div class="flex items-center gap-1">
                      <button id="btn-rot-left" type="button" class="px-1.5 py-0.5 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">-90\xB0</button>
                      <span id="val-rotation" class="font-mono text-[10px] font-bold">0\xB0</span>
                      <button id="btn-rot-right" type="button" class="px-1.5 py-0.5 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">+90\xB0</button>
                    </div>
                  </div>
                  <input id="slider-rotation" type="range" min="-180" max="180" value="0" class="m3-slider" />
                </div>
              </div>

              <!-- 3. Optional Touch-Up Brush for Hair & Glasses -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px] text-m3-primary">brush</span>
                    <span>Edge Touch-Up Brush</span>
                  </span>
                  <div class="flex items-center gap-1">
                    <button id="btn-brush-undo" type="button" class="px-2 py-0.5 rounded bg-[var(--m3-surface-2)] text-[10px] font-mono font-bold disabled:opacity-40" title="Undo (Ctrl+Z)">Undo</button>
                    <button id="btn-brush-redo" type="button" class="px-2 py-0.5 rounded bg-[var(--m3-surface-2)] text-[10px] font-mono font-bold disabled:opacity-40" title="Redo (Ctrl+Y)">Redo</button>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                  <button id="btn-brush-off" type="button" class="py-1 px-1.5 rounded-lg text-xs font-bold text-center transition m3-primary">Pan</button>
                  <button id="btn-brush-erase" type="button" class="py-1 px-1.5 rounded-lg text-xs font-bold text-center transition m3-text-muted hover:text-m3-text">Erase BG</button>
                  <button id="btn-brush-restore" type="button" class="py-1 px-1.5 rounded-lg text-xs font-bold text-center transition m3-text-muted hover:text-m3-text">Restore FG</button>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] m3-text-muted">Size</span>
                  <input id="slider-brush-size" type="range" min="5" max="60" step="1" value="22" class="m3-slider flex-1" />
                  <span id="val-brush-size" class="font-mono text-[10px] font-bold w-8 text-right">22px</span>
                </div>
              </div>

              <!-- Signature Mode Ink Controls (Shown only in Signature mode) -->
              <div id="signature-adjust-controls" class="hidden m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex-col gap-2">
                <div class="font-bold text-xs">Bradley-Roth Signature Ink Isolation</div>
                <div class="grid grid-cols-2 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                  <button id="btn-sig-ink-original" type="button" class="py-1 px-2 rounded-lg text-xs font-bold m3-primary">Original Ink Color</button>
                  <button id="btn-sig-ink-mono" type="button" class="py-1 px-2 rounded-lg text-xs font-bold m3-text-muted">Pure Mono Black</button>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-1 text-[11px]">
                    <span class="font-medium">Ink Thickness / Contrast</span>
                    <span id="val-sig-threshold" class="font-mono font-bold">t = 0.14</span>
                  </div>
                  <input id="slider-sig-threshold" type="range" min="6" max="26" step="1" value="14" class="m3-slider" />
                </div>
              </div>

              <button id="btn-goto-step-export" type="button" class="w-full py-2.5 px-3 rounded-xl m3-primary font-bold text-xs flex items-center justify-center gap-1 shadow transition">
                <span>Continue to Step 3: Export Photo</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <!-- ================= STEP 3: EXPORT PANEL ================= -->
            <div id="panel-step-export" class="hidden flex-col gap-3">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-bold text-sm uppercase tracking-wide text-m3-text flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full m3-primary flex items-center justify-center text-[10px]">3</span>
                  <span>Export &amp; Validation</span>
                </h3>
                <span id="export-validation-badge" class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-mono font-bold text-[10px]">PASS 5/5</span>
              </div>

              <!-- Output Dimensions & Format Selection -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold">Exact Output Dimensions</span>
                  <span id="export-exact-dims" class="font-mono font-bold text-sm text-m3-primary">300 \xD7 350 px</span>
                </div>
                <div class="text-[11px] m3-text-muted" id="export-physical-dims">25.4 \xD7 29.6 mm @ 300 DPI</div>

                <!-- Format Pills (JPG, JPEG, PNG, WEBP) -->
                <div>
                  <span class="text-[11px] font-semibold m3-text-muted block mb-1">Image Format</span>
                  <div id="format-selector-group" class="grid grid-cols-4 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                    <button type="button" data-format="image/jpeg" data-ext="JPG" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-primary">JPG</button>
                    <button type="button" data-format="image/jpeg" data-ext="JPEG" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-text-muted">JPEG</button>
                    <button type="button" data-format="image/png" data-ext="PNG" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-text-muted">PNG</button>
                    <button type="button" data-format="image/webp" data-ext="WEBP" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-text-muted">WEBP</button>
                  </div>
                </div>

                <!-- Resolution Quality (Low 0.75x, Standard 1x, High 2x) -->
                <div>
                  <span class="text-[11px] font-semibold m3-text-muted block mb-1">Resolution Scale</span>
                  <div id="resolution-tier-group" class="grid grid-cols-3 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                    <button type="button" data-tier="low" class="tier-btn py-1 px-1 rounded-lg text-xs font-bold transition m3-text-muted">Low 0.75\xD7</button>
                    <button type="button" data-tier="standard" class="tier-btn py-1 px-1 rounded-lg text-xs font-bold transition m3-primary">Std 1\xD7</button>
                    <button type="button" data-tier="high" class="tier-btn py-1 px-1 rounded-lg text-xs font-bold transition m3-text-muted">High 2\xD7</button>
                  </div>
                </div>

                <!-- File Size Cap Slider -->
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-max-kb" class="text-xs font-semibold">Maximum File Size Cap</label>
                    <span id="val-max-kb" class="font-mono text-[10px] font-bold px-2 py-0.5 rounded m3-surface-2">\u2264 75 KB</span>
                  </div>
                  <input id="slider-max-kb" type="range" min="15" max="200" step="5" value="75" class="m3-slider" />
                  <div class="flex justify-between text-[10px] font-mono m3-text-muted mt-1">
                    <span>Result Size: <strong id="val-live-filesize" class="text-emerald-600 font-bold">54.2 KB</strong></span>
                    <span>Cap: <strong id="val-live-cap">75 KB</strong></span>
                  </div>
                </div>
              </div>

              <!-- Primary Export Action Button -->
              <button id="btn-export-primary" type="button" class="w-full py-3.5 px-4 rounded-2xl m3-primary font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition">
                <span class="material-symbols-outlined text-[20px]">download</span>
                <span id="export-btn-text">Download Admission Photo</span>
              </button>

              <!-- A4 PDF Contact Sheet Option -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex items-center justify-between">
                <div>
                  <div class="font-bold text-xs">Printable A4 Sheet (PDF)</div>
                  <div class="text-[11px] m3-text-muted">8 calibrated crop-marked copies on 210\xD7297mm paper</div>
                </div>
                <button id="btn-export-pdf-sheet" type="button" class="m3-spring px-3 py-1.5 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-xs font-bold flex items-center gap-1 shrink-0">
                  <span class="material-symbols-outlined text-[15px] text-sky-500">picture_as_pdf</span>
                  <span>A4 PDF</span>
                </button>
              </div>
            </div>

            <!-- ================= COLLAPSIBLE ADVANCED SETTINGS ================= -->
            <!-- All technical settings, neural model selectors, edge choke/feather, and diagnostics live here, collapsed by default -->
            <details id="details-advanced-settings" class="m3-surface rounded-2xl border border-[var(--m3-outline-variant)] text-xs transition">
              <summary class="p-3 font-semibold text-m3-text cursor-pointer select-none flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[17px] m3-text-muted">tune</span>
                  <span>Advanced Matte &amp; Engine Settings</span>
                </span>
                <span class="material-symbols-outlined text-[16px] m3-text-muted transform transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              
              <div class="p-3 pt-0 flex flex-col gap-3 border-t border-[var(--m3-outline-variant)]/60 mt-2">
                <!-- Neural Model Selection -->
                <div>
                  <span class="text-[11px] font-semibold m3-text-muted block mb-1">On-Device Neural Model</span>
                  <div class="grid grid-cols-3 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                    <button id="btn-neural-tier-rmbg" type="button" class="py-1 px-1 rounded-lg text-[10px] font-bold text-center transition m3-primary" title="briaai/RMBG-1.4 (1024\xD71024)">RMBG-1.4</button>
                    <button id="btn-neural-tier-modnet" type="button" class="py-1 px-1 rounded-lg text-[10px] font-bold text-center transition m3-text-muted" title="Xenova/modnet (512\xD7512)">MODNet</button>
                    <button id="btn-neural-tier-imgly" type="button" class="py-1 px-1 rounded-lg text-[10px] font-bold text-center transition m3-text-muted" title="IMG.LY 1.7">IMG.LY</button>
                  </div>
                </div>

                <!-- Edge Choke & Feather Sliders -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <div class="flex justify-between text-[10px] font-medium mb-1">
                      <span>Edge Choke</span>
                      <span id="val-bg-choke" class="font-mono font-bold">0 px</span>
                    </div>
                    <input id="slider-bg-choke" type="range" min="-2" max="2" step="0.5" value="0" class="m3-slider" />
                  </div>
                  <div>
                    <div class="flex justify-between text-[10px] font-medium mb-1">
                      <span>Edge Feather</span>
                      <span id="val-bg-feather" class="font-mono font-bold">0 px</span>
                    </div>
                    <input id="slider-bg-feather" type="range" min="0" max="3" step="0.5" value="0" class="m3-slider" />
                  </div>
                </div>

                <!-- Enclosed Hole Fill & Raw Mask Inspection -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-medium">Hole Fill:</span>
                    <button id="btn-hole-smart" type="button" class="px-2 py-0.5 rounded text-[10px] font-bold m3-primary">Smart</button>
                    <button id="btn-hole-off" type="button" class="px-2 py-0.5 rounded text-[10px] font-bold m3-surface-2 m3-text-muted">Off</button>
                  </div>
                  <label class="flex items-center gap-1 text-[10px] font-mono cursor-pointer select-none">
                    <input id="chk-bypass-refinement" type="checkbox" ${n.bypassRefinement?"checked":""} class="accent-[var(--m3-primary)] rounded" />
                    <span>Raw Mask</span>
                  </label>
                  <label class="flex items-center gap-1 text-[10px] font-mono cursor-pointer select-none">
                    <input id="chk-mask-overlay" type="checkbox" class="accent-[var(--m3-primary)] rounded" />
                    <span>Mask Overlay</span>
                  </label>
                </div>

                <!-- Technical Diagnostics Summary -->
                <div class="m3-surface-2 rounded-xl p-2 font-mono text-[9px] space-y-0.5">
                  <div class="flex justify-between"><span class="m3-text-muted">Model:</span> <span id="diag-model-id" class="font-bold">briaai/RMBG-1.4</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">Backend:</span> <span id="diag-backend" class="font-bold text-emerald-600">probing\u2026</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">Duration:</span> <span id="diag-duration">\u2014</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">BG Speckles:</span> <span id="diag-speckles">\u2014</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">FG Holes:</span> <span id="diag-holes">\u2014</span></div>
                  <div id="diag-error-box" class="hidden text-rose-500 font-sans text-[10px] pt-1">
                    <span id="diag-error-text"></span>
                  </div>
                </div>

                <!-- Benchmark Suite Button -->
                <button id="btn-open-benchmark-suite" type="button" class="w-full py-1.5 px-2 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-[11px] font-bold text-sky-600 flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">science</span>
                  <span>Open 8-Scenario Accuracy Benchmark Suite</span>
                </button>
              </div>
            </details>
          </aside>

          <!-- CENTER CANVAS WORKSPACE (Dead-Center, Responsive, 100% Unobstructed) -->
          <section class="flex-1 h-full min-h-0 flex flex-col items-center justify-center p-3 sm:p-5 studio-dot-grid overflow-hidden order-1 md:order-2 relative">
            
            <!-- EMPTY STATE DROPZONE (Shown before photo is uploaded) -->
            <div id="empty-upload-stage" class="w-full max-w-md m3-surface-1 rounded-3xl p-6 sm:p-8 border-2 border-dashed border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] transition flex flex-col items-center text-center cursor-pointer shadow-sm">
              <div class="w-14 h-14 rounded-2xl m3-primary-container flex items-center justify-center mb-3">
                <span class="material-symbols-outlined text-[32px] text-m3-primary">add_a_photo</span>
              </div>
              <h2 class="font-display font-bold text-base sm:text-lg text-m3-text">Select or Take a Photo</h2>
              <p class="text-xs m3-text-muted mt-1 max-w-xs leading-relaxed">
                Take a phone photo against any room wall. FormPhoto automatically removes the background and sizes it for your application.
              </p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button id="btn-empty-choose" type="button" class="px-4 py-2 rounded-full m3-primary font-bold text-xs shadow flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Choose Photo</span>
                </button>
                <button id="btn-empty-paste" type="button" class="px-3.5 py-2 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-bold text-xs flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">content_paste</span>
                  <span>Paste (Ctrl+V)</span>
                </button>
              </div>
              <div class="mt-4 pt-3 border-t border-[var(--m3-outline-variant)] w-full flex items-center justify-center gap-3 text-[11px] font-mono m3-text-muted">
                <span id="empty-target-spec-hint">BUET 300 \xD7 350 px \u2022 \u2264 75 KB JPG</span>
              </div>
            </div>

            <!-- ACTIVE WORKBENCH CANVAS (Shown when photo is loaded) -->
            <div id="workbench-stage-grid" class="hidden flex-col items-center justify-center w-full h-full max-w-4xl relative">
              
              <!-- Centered Calibrated Output Card -->
              <div id="stage-output-card" class="m3-surface-1 rounded-3xl p-3 sm:p-4 border border-[var(--m3-outline-variant)] flex flex-col items-center shadow-lg relative max-w-full max-h-full">
                
                <!-- Card Header with Clear & Replace actions -->
                <div class="w-full flex items-center justify-between gap-3 mb-2 px-1">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span id="canvas-live-pill" class="text-xs font-mono font-bold text-m3-text">300 \xD7 350 px</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button id="btn-stage-replace" type="button" class="text-[11px] font-semibold px-2 py-0.5 rounded-lg m3-surface-2 hover:m3-surface-3" title="Replace Photo">Replace</button>
                    <button id="btn-stage-clear" type="button" class="text-[11px] font-semibold px-2 py-0.5 rounded-lg m3-surface-2 hover:text-rose-600" title="Clear Photo">Clear</button>
                  </div>
                </div>

                <!-- Viewport Frame Wrapper -->
                <div id="output-viewport-box" class="relative rounded-2xl overflow-hidden flex items-center justify-center p-3 checker-bg select-none border border-[var(--m3-outline-variant)]">
                  <div id="calibrated-frame-wrap" class="relative shadow-xl rounded-lg overflow-hidden border border-white/80 transition-all duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing" style="width: 240px; height: 280px;">
                    <img id="converted-preview-img" alt="Converted Admission Photo" referrerpolicy="no-referrer" class="w-full h-full object-contain pointer-events-none select-none" />
                    
                    <!-- Biometric Alignment Guide Overlay -->
                    <div id="biometric-guide-overlay" class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-35">
                      <div id="biometric-oval" class="w-[62%] h-[68%] border border-dashed border-sky-400 rounded-full"></div>
                      <div class="w-full border-t border-dashed border-sky-400/60 absolute top-[50%]"></div>
                      <div class="h-full border-l border-dashed border-sky-400/60 absolute left-[50%]"></div>
                    </div>

                    <!-- Live Brush Ring Indicator -->
                    <div id="brush-cursor-ring" class="hidden absolute rounded-full border-2 border-amber-400 bg-amber-400/20 pointer-events-none z-20" style="width: 22px; height: 22px; transform: translate(-50%, -50%);"></div>

                    <!-- Neural Loading Overlay Pill -->
                    <div id="canvas-neural-loading-pill" class="hidden absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 items-center justify-center gap-2 pointer-events-none">
                      <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                      <span id="canvas-neural-loading-text" class="text-[10px] font-mono font-bold text-white truncate">Removing Background\u2026</span>
                    </div>
                  </div>
                </div>

                <!-- Bottom Helper Bar under Canvas -->
                <div class="w-full mt-2 flex items-center justify-between text-[11px] font-mono px-1">
                  <label class="flex items-center gap-1.5 m3-text-muted cursor-pointer select-none text-xs">
                    <input id="chk-biometric-grid" type="checkbox" checked class="accent-[var(--m3-primary)] rounded" />
                    <span>Alignment Grid</span>
                  </label>
                  <span id="out-filesize-badge" class="font-bold text-emerald-600">Ready</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <!-- COMPACT MOBILE NAVIGATION BAR (Visible on <md screens) -->
        <nav class="md:hidden w-full h-[52px] border-t border-[var(--m3-outline-variant)] m3-surface-1 flex items-center justify-around px-2 shrink-0 z-40 select-none pb-[env(safe-area-inset-bottom)]">
          <button id="nav-mobile-photo" type="button" class="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-[var(--m3-primary)]">
            <span class="material-symbols-outlined text-[20px]">add_photo_alternate</span>
            <span>1. Photo</span>
          </button>
          <button id="nav-mobile-adjust" type="button" class="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-[var(--m3-text-muted)]">
            <span class="material-symbols-outlined text-[20px]">palette</span>
            <span>2. Adjust</span>
          </button>
          <button id="nav-mobile-export" type="button" class="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-[var(--m3-text-muted)]">
            <span class="material-symbols-outlined text-[20px]">file_download</span>
            <span>3. Export</span>
          </button>
        </nav>
      </div>

      <!-- POP-UP MODAL 1: Admission Portals Selector -->
      <div id="modal-portals" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div class="m3-surface-1 max-w-2xl w-full rounded-3xl p-5 border border-[var(--m3-outline-variant)] shadow-2xl max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-m3-primary text-[22px]">school</span>
              <div>
                <h3 class="font-display font-bold text-base">Select Admission Portal</h3>
                <p class="text-xs m3-text-muted">Automatically applies exact official dimensions, ratio, and file size caps.</p>
              </div>
            </div>
            <button data-close-modal="portals" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center hover:m3-surface-3">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 mt-3 space-y-3 pr-1">
            <div id="preset-chips-container" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5"></div>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 2: 100% On-Device Privacy -->
      <div id="modal-privacy" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-md w-full rounded-3xl p-5 border border-[var(--m3-outline-variant)] shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-500">lock</span>
              <h3 class="font-display font-bold text-base">Student Data Privacy</h3>
            </div>
            <button data-close-modal="privacy" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <p class="text-xs m3-text-muted my-3 leading-relaxed">
            FormPhoto processes your photo <strong>100% locally inside your browser</strong>. Your portrait, background removal, and signatures never leave your device. Zero photos are sent to any remote server or cloud service.
          </p>
          <div class="flex justify-end">
            <button data-close-modal="privacy" type="button" class="px-4 py-1.5 rounded-full m3-primary text-xs font-bold">Understood</button>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 3: Accuracy Benchmark Suite -->
      <div id="modal-benchmark" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
        <div class="m3-surface-1 max-w-4xl w-full rounded-3xl p-5 border border-[var(--m3-outline-variant)] shadow-2xl max-h-[88vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sky-500 text-[22px]">science</span>
              <div>
                <h3 class="font-display font-bold text-base">Neural Matting Accuracy &amp; Benchmark Test Suite</h3>
                <p class="text-xs m3-text-muted">Compare briaai/RMBG-1.4 (1024\xD71024) vs Xenova/modnet across 8 difficult scenarios.</p>
              </div>
            </div>
            <button data-close-modal="benchmark" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center hover:m3-surface-3">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 mt-3 space-y-3 pr-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-bold">Select Scenario:</span>
              <button id="btn-bench-load-into-studio" type="button" class="px-3 py-1 rounded-full m3-primary text-xs font-bold flex items-center gap-1 shadow">
                <span class="material-symbols-outlined text-[15px]">input</span>
                <span>Load Scenario Into Studio</span>
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${le.map(s=>`
                <button type="button" data-scenario-id="${s.id}" class="bench-scenario-btn text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${s.id===this.selectedBenchmarkScenario?"m3-primary-container border-[var(--m3-primary)]":"m3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]"}">
                  <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-black/10 font-bold mb-1">${s.challengeTag}</span>
                  <div class="font-bold text-xs leading-snug">${s.title}</div>
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Toast Banner -->
      <div id="m3-toast-banner" class="fixed bottom-14 md:bottom-4 left-4 z-50 max-w-sm m3-primary px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold opacity-0 pointer-events-none translate-y-4 transition-all duration-200">
        <span class="material-symbols-outlined text-[16px]">check_circle</span>
        <span id="m3-toast-text">Ready</span>
      </div>
    `,this.renderPresetChips(),this.bindEvents()}renderPresetChips(){let e=document.getElementById("preset-chips-container");if(!e)return;let t=this.getAllPresetsList();e.innerHTML=t.map(n=>{let s=n.id===this.state.presetId;return`
        <button
          type="button"
          data-preset-id="${n.id}"
          class="preset-chip m3-spring text-left p-3 rounded-2xl border transition flex flex-col justify-between ${s?"m3-primary-container border-[var(--m3-primary)] shadow-sm":"m3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]"}"
        >
          <div class="flex items-center justify-between w-full mb-1">
            <span class="font-bold text-xs sm:text-sm text-m3-text">${n.name}</span>
            <span class="w-2.5 h-2.5 rounded-full ${s?"bg-[var(--m3-primary)]":"bg-emerald-500/70"} shrink-0"></span>
          </div>
          <div class="font-mono text-xs font-bold text-m3-primary mb-1">${n.widthPx} \xD7 ${n.heightPx} px (${n.ratioLabel})</div>
          <div class="text-[11px] opacity-75">${n.note}</div>
        </button>
      `}).join(""),e.querySelectorAll(".preset-chip").forEach(n=>{n.addEventListener("click",()=>{let s=n.dataset.presetId;s&&W[s]&&(this.applyPreset(W[s]),document.getElementById("modal-portals")?.classList.add("hidden"))})})}renderExportHistoryStrip(){}bindEvents(){let e=document.getElementById("local-file-input"),t=()=>{e?.click()};document.getElementById("btn-sidebar-upload")?.addEventListener("click",t),document.getElementById("btn-empty-choose")?.addEventListener("click",t),document.getElementById("btn-stage-replace")?.addEventListener("click",t),document.getElementById("empty-upload-stage")?.addEventListener("click",l=>{l.target.closest("#btn-empty-paste")||t()}),document.getElementById("btn-sidebar-paste")?.addEventListener("click",()=>{this.handleClipboardPasteButton()}),document.getElementById("btn-empty-paste")?.addEventListener("click",l=>{l.stopPropagation(),this.handleClipboardPasteButton()}),window.addEventListener("paste",l=>{let p=l.clipboardData?.items;if(p)for(let x=0;x<p.length;x++){let v=p[x];if(v.type.startsWith("image/")){let c=v.getAsFile();if(c){l.preventDefault(),this.handleLocalFileUpload(c,"Pasted");return}}}}),document.getElementById("btn-stage-clear")?.addEventListener("click",()=>{this.clearUploadedImage()}),["photo","adjust","export"].forEach(l=>{document.getElementById(`tab-step-${l}`)?.addEventListener("click",()=>{this.setWorkflowStep(l)}),document.getElementById(`nav-mobile-${l}`)?.addEventListener("click",()=>{this.setWorkflowStep(l)})}),document.getElementById("btn-goto-step-adjust")?.addEventListener("click",()=>{this.setWorkflowStep("adjust")}),document.getElementById("btn-goto-step-export")?.addEventListener("click",()=>{this.setWorkflowStep("export")});let n=()=>{document.getElementById("modal-portals")?.classList.remove("hidden")};document.getElementById("btn-open-portal-popup")?.addEventListener("click",n),document.getElementById("btn-step1-change-portal")?.addEventListener("click",n),document.getElementById("btn-privacy-badge")?.addEventListener("click",()=>{document.getElementById("modal-privacy")?.classList.remove("hidden")}),document.getElementById("btn-open-benchmark-suite")?.addEventListener("click",()=>{document.getElementById("modal-benchmark")?.classList.remove("hidden")}),document.querySelectorAll("[data-close-modal]").forEach(l=>{l.addEventListener("click",()=>{let p=l.dataset.closeModal;p&&document.getElementById(`modal-${p}`)?.classList.add("hidden")})}),document.querySelectorAll(".bench-scenario-btn").forEach(l=>{l.addEventListener("click",()=>{let p=l.dataset.scenarioId;p&&(this.selectedBenchmarkScenario=p,document.querySelectorAll(".bench-scenario-btn").forEach(x=>{let v=x.dataset.scenarioId===p;x.className=`bench-scenario-btn text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${v?"m3-primary-container border-[var(--m3-primary)]":"m3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]"}`}))})}),document.getElementById("btn-bench-load-into-studio")?.addEventListener("click",()=>{document.getElementById("modal-benchmark")?.classList.add("hidden"),this.loadBenchmarkScenarioIntoEditor(this.selectedBenchmarkScenario)}),[document.getElementById("empty-upload-stage"),document.getElementById("stage-output-card")].forEach(l=>{l?.addEventListener("dragover",p=>{p.preventDefault(),l.classList.add("ring-2","ring-[var(--m3-primary)]")}),l?.addEventListener("dragleave",()=>{l.classList.remove("ring-2","ring-[var(--m3-primary)]")}),l?.addEventListener("drop",p=>{p.preventDefault(),l.classList.remove("ring-2","ring-[var(--m3-primary)]");let x=p.dataTransfer?.files?.[0];x&&this.handleLocalFileUpload(x)})}),e?.addEventListener("change",()=>{let l=e.files?.[0];l&&(this.handleLocalFileUpload(l),e.value="")}),document.getElementById("mode-btn-photo")?.addEventListener("click",()=>{this.applyPreset(W.buet)}),document.getElementById("mode-btn-signature")?.addEventListener("click",()=>{this.applyPreset(W.buet_sig)}),document.querySelectorAll("#theme-switcher-bar .theme-pill").forEach(l=>{l.addEventListener("click",()=>{let p=l.dataset.theme;p&&(this.state.theme=p,this.applyThemeClass(p),this.syncThemeButtons())})}),document.getElementById("btn-mobile-theme-toggle")?.addEventListener("click",()=>{let l=oe.indexOf(this.state.theme),p=oe[(l+1)%oe.length];this.state.theme=p,this.applyThemeClass(p),this.syncThemeButtons()});let a=(l,p)=>{let x=document.getElementById(l);x?.addEventListener("input",()=>{p(parseFloat(x.value)),this.schedulePipelineUpdate()})};a("slider-zoom",l=>{this.state.scalePct=l}),a("slider-pan-x",l=>{this.state.offsetX=l}),a("slider-pan-y",l=>{this.state.offsetY=l}),a("slider-rotation",l=>{this.state.rotationDeg=l}),a("slider-max-kb",l=>{this.state.targetCapKb=l}),a("slider-bg-choke",l=>{this.state.bgChokePx=l}),a("slider-bg-feather",l=>{this.state.bgFeather=l}),a("slider-sig-threshold",l=>{this.state.sigThreshold=l}),a("slider-brush-size",l=>{this.brushSizePx=l;let p=document.getElementById("brush-cursor-ring");p&&(p.style.width=`${l}px`,p.style.height=`${l}px`)}),document.getElementById("btn-rot-left")?.addEventListener("click",()=>{this.state.rotationDeg=(this.state.rotationDeg-90+540)%360-180,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-rot-right")?.addEventListener("click",()=>{this.state.rotationDeg=(this.state.rotationDeg+90+540)%360-180,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-reset-crop")?.addEventListener("click",()=>{this.state.scalePct=100,this.state.offsetX=0,this.state.offsetY=0,this.state.rotationDeg=0,this.state.bgChokePx=0,this.state.bgFeather=0,this.brushMode="off",this.schedulePipelineUpdate(!0),this.showToast("Reset photo crop and alignment.")}),document.getElementById("btn-toggle-bg-remove")?.addEventListener("click",()=>{this.state.bgRemovalEnabled=!this.state.bgRemovalEnabled,this.schedulePipelineUpdate(!0),this.triggerNeuralMattingIfNeeded()}),document.querySelectorAll(".bg-swatch").forEach(l=>{l.addEventListener("click",()=>{let p=l.dataset.bgtone;p&&(this.state.bgTone=p,this.state.bgRemovalEnabled=!0,p==="alpha"&&this.state.format==="image/jpeg"&&(this.state.format="image/png",this.state.formatExtLabel="PNG",this.showToast("Switched format to PNG to keep transparent background.")),this.schedulePipelineUpdate(!0),this.triggerNeuralMattingIfNeeded())})});let f=document.getElementById("input-custom-bg-color");f?.addEventListener("input",()=>{this.state.customBgColor=f.value,this.state.bgTone="custom",this.state.bgRemovalEnabled=!0,this.schedulePipelineUpdate(),this.triggerNeuralMattingIfNeeded()}),document.querySelectorAll("#format-selector-group .format-btn").forEach(l=>{l.addEventListener("click",()=>{let p=l.dataset.format,x=l.dataset.ext;p&&x&&(this.state.format=p,this.state.formatExtLabel=x,this.schedulePipelineUpdate(!0))})}),document.querySelectorAll("#resolution-tier-group .tier-btn").forEach(l=>{l.addEventListener("click",()=>{let p=l.dataset.tier;p&&(this.state.resolutionTier=p,this.schedulePipelineUpdate(!0))})});let i=l=>{this.brushMode=l,this.syncBrushModeButtons(),l!=="off"&&this.showToast(l==="erase"?"Touch-Up Brush: Paint on canvas to erase stray background spots.":"Touch-Up Brush: Paint on canvas to restore hair, glasses, or clothing.")};document.getElementById("btn-brush-off")?.addEventListener("click",()=>i("off")),document.getElementById("btn-brush-erase")?.addEventListener("click",()=>i("erase")),document.getElementById("btn-brush-restore")?.addEventListener("click",()=>i("restore")),document.getElementById("btn-brush-undo")?.addEventListener("click",()=>{Le()&&this.schedulePipelineUpdate(!0)}),document.getElementById("btn-brush-redo")?.addEventListener("click",()=>{Ue()&&this.schedulePipelineUpdate(!0)});let u=document.getElementById("calibrated-frame-wrap"),r=document.getElementById("brush-cursor-ring");u?.addEventListener("pointerenter",()=>{this.brushMode!=="off"&&this.state.mode==="photo"&&r&&r.classList.remove("hidden")}),u?.addEventListener("pointerleave",()=>{r&&r.classList.add("hidden")}),u?.addEventListener("pointerdown",l=>{if(this.isDraggingCanvas=!0,u.setPointerCapture(l.pointerId),this.brushMode!=="off"&&this.state.mode==="photo"){Re(),this.applyTouchUpBrushAtPointer(l.clientX,l.clientY),this.syncRuntimeDiagnosticsPanel();return}this.dragStart={x:l.clientX,y:l.clientY,offsetX:this.state.offsetX,offsetY:this.state.offsetY}}),u?.addEventListener("pointermove",l=>{if(r&&this.brushMode!=="off"&&this.state.mode==="photo"){let v=u.getBoundingClientRect();r.style.left=`${l.clientX-v.left}px`,r.style.top=`${l.clientY-v.top}px`,r.style.width=`${this.brushSizePx}px`,r.style.height=`${this.brushSizePx}px`,r.classList.remove("hidden")}if(!this.isDraggingCanvas)return;if(this.brushMode!=="off"&&this.state.mode==="photo"){this.applyTouchUpBrushAtPointer(l.clientX,l.clientY);return}let p=l.clientX-this.dragStart.x,x=l.clientY-this.dragStart.y;this.state.offsetX=Math.max(-120,Math.min(120,Math.round(this.dragStart.offsetX+p*.6))),this.state.offsetY=Math.max(-120,Math.min(120,Math.round(this.dragStart.offsetY+x*.6))),this.schedulePipelineUpdate()}),u?.addEventListener("pointerup",()=>{this.isDraggingCanvas=!1,this.syncRuntimeDiagnosticsPanel()});let h=document.getElementById("chk-biometric-grid");h?.addEventListener("change",()=>{this.state.showGrid=h.checked;let l=document.getElementById("biometric-guide-overlay");l&&l.classList.toggle("hidden",!h.checked)});let m=l=>{this.neuralModelTier=l,this.syncNeuralTierButtons(),this.triggerNeuralMattingIfNeeded(!0),this.schedulePipelineUpdate(!0)};document.getElementById("btn-neural-tier-rmbg")?.addEventListener("click",()=>m("rmbg_14")),document.getElementById("btn-neural-tier-modnet")?.addEventListener("click",()=>m("modnet")),document.getElementById("btn-neural-tier-imgly")?.addEventListener("click",()=>m("imgly_medium")),document.getElementById("btn-hole-smart")?.addEventListener("click",()=>{re({holeFillMode:"smart"}),this.syncHoleFillButtons("smart"),this.schedulePipelineUpdate(!0)}),document.getElementById("btn-hole-off")?.addEventListener("click",()=>{re({holeFillMode:"off"}),this.syncHoleFillButtons("off"),this.schedulePipelineUpdate(!0)});let E=document.getElementById("chk-bypass-refinement");E?.addEventListener("change",()=>{re({bypassRefinement:E.checked}),this.schedulePipelineUpdate(!0)});let b=document.getElementById("chk-mask-overlay");b?.addEventListener("change",()=>{this.state.showMaskOverlay=b.checked,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-sig-ink-original")?.addEventListener("click",()=>{this.state.sigInkColorMode="original",this.state.sigHighContrast=!1,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-sig-ink-mono")?.addEventListener("click",()=>{this.state.sigInkColorMode="mono",this.state.sigHighContrast=!0,this.schedulePipelineUpdate(!0)}),document.getElementById("btn-export-primary")?.addEventListener("click",()=>{this.handleExportCurrentFile()}),document.getElementById("btn-export-pdf-sheet")?.addEventListener("click",()=>{this.handleExportA4PdfSheet()})}syncHoleFillButtons(e){let t=document.getElementById("btn-hole-smart"),n=document.getElementById("btn-hole-off");t&&(t.className=`px-2 py-0.5 rounded text-[10px] font-bold ${e==="smart"?"m3-primary":"m3-surface-2 m3-text-muted"}`),n&&(n.className=`px-2 py-0.5 rounded text-[10px] font-bold ${e==="off"?"m3-primary":"m3-surface-2 m3-text-muted"}`)}syncThemeButtons(){document.querySelectorAll("#theme-switcher-bar .theme-pill").forEach(e=>{let t=e.dataset.theme===this.state.theme;e.className=`theme-pill w-7 h-7 rounded-full flex items-center justify-center text-xs transition ${t?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`})}syncNeuralTierButtons(){let e={rmbg_14:"btn-neural-tier-rmbg",modnet:"btn-neural-tier-modnet",imgly_medium:"btn-neural-tier-imgly"};Object.keys(e).forEach(t=>{let n=document.getElementById(e[t]);if(n){let s=this.neuralModelTier===t;n.className=`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition ${s?"m3-primary":"m3-text-muted hover:text-m3-text"}`}})}syncBrushModeButtons(){let e={off:"btn-brush-off",erase:"btn-brush-erase",restore:"btn-brush-restore"};Object.keys(e).forEach(s=>{let a=document.getElementById(e[s]);if(a){let f=this.brushMode===s;a.className=`py-1 px-1.5 rounded-lg text-xs font-bold text-center transition ${f?"m3-primary":"m3-text-muted hover:text-m3-text"}`}});let t=document.getElementById("calibrated-frame-wrap"),n=document.getElementById("brush-cursor-ring");t&&(t.style.cursor=this.brushMode==="off"?"grab":"crosshair"),n&&this.brushMode==="off"&&n.classList.add("hidden")}syncDynamicDOM(e){let t=this.getActivePreset();this.renderPresetChips(),this.syncThemeButtons(),this.syncNeuralTierButtons(),this.syncBrushModeButtons();let n=document.getElementById("empty-upload-stage"),s=document.getElementById("workbench-stage-grid");n&&s&&(e.hasSourceImage?(n.classList.add("hidden"),s.classList.remove("hidden"),s.classList.add("flex")):(n.classList.remove("hidden"),s.classList.add("hidden"),s.classList.remove("flex")));let a=(P,d)=>{let w=document.getElementById(P);w&&(w.textContent=d)};a("header-portal-label",`${t.shortName} \u2022 ${t.widthPx}\xD7${t.heightPx}`),a("summary-portal-name",t.name),a("summary-portal-ratio",t.ratioLabel),a("summary-portal-note",t.note),a("summary-portal-dims",`${t.widthPx} \xD7 ${t.heightPx} px`),a("summary-portal-maxkb",`\u2264 ${t.maxKb} KB`),a("empty-target-spec-hint",`${t.shortName} ${e.outWidth} \xD7 ${e.outHeight} px \u2022 \u2264 ${this.state.targetCapKb} KB ${this.state.formatExtLabel}`);let f=document.getElementById("mode-btn-photo"),i=document.getElementById("mode-btn-signature");f&&i&&(f.className=`px-2.5 py-1 rounded-full transition ${this.state.mode==="photo"?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`,i.className=`px-2.5 py-1 rounded-full transition ${this.state.mode==="signature"?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`);let u=document.getElementById("signature-adjust-controls");u&&(u.classList.toggle("hidden",this.state.mode!=="signature"),u.classList.toggle("flex",this.state.mode==="signature"));let r=(P,d,w,M)=>{let C=document.getElementById(P),S=document.getElementById(d);C&&document.activeElement!==C&&(C.value=String(w)),S&&(S.textContent=M)};r("slider-zoom","val-zoom",this.state.scalePct,`${this.state.scalePct}%`),r("slider-pan-x","val-pan-x",this.state.offsetX,`${this.state.offsetX>0?"+":""}${this.state.offsetX}`),r("slider-pan-y","val-pan-y",this.state.offsetY,`${this.state.offsetY>0?"+":""}${this.state.offsetY}`),r("slider-rotation","val-rotation",this.state.rotationDeg,`${this.state.rotationDeg}\xB0`),r("slider-max-kb","val-max-kb",this.state.targetCapKb,`\u2264 ${this.state.targetCapKb} KB`);let h=this.state.bgChokePx>0?"+":"";r("slider-bg-choke","val-bg-choke",this.state.bgChokePx,`${h}${this.state.bgChokePx} px`),r("slider-bg-feather","val-bg-feather",this.state.bgFeather,`${this.state.bgFeather} px`),r("slider-brush-size","val-brush-size",this.brushSizePx,`${this.brushSizePx}px`);let m=(this.state.sigThreshold/100).toFixed(2);r("slider-sig-threshold","val-sig-threshold",this.state.sigThreshold,`t = ${m}`);let E=document.getElementById("bg-remove-status-text"),b=document.getElementById("btn-toggle-bg-remove");E&&(E.textContent=this.state.bgRemovalEnabled?"ON":"OFF"),b&&(b.className=`m3-spring px-3 py-1 rounded-full font-mono font-bold text-[11px] ${this.state.bgRemovalEnabled?"m3-primary":"m3-surface-2 m3-text-muted"}`),document.querySelectorAll(".bg-swatch").forEach(P=>{let d=P.dataset.bgtone===this.state.bgTone;P.classList.toggle("ring-2",d),P.classList.toggle("ring-[var(--m3-primary)]",d)}),document.querySelectorAll("#format-selector-group .format-btn").forEach(P=>{let d=P.dataset.ext===this.state.formatExtLabel;P.className=`format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition ${d?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`}),document.querySelectorAll("#resolution-tier-group .tier-btn").forEach(P=>{let d=P.dataset.tier===this.state.resolutionTier;P.className=`tier-btn py-1 px-1 rounded-lg text-xs font-bold transition ${d?"m3-primary shadow-sm":"m3-text-muted hover:text-m3-text"}`});let l=document.getElementById("converted-preview-img"),p=document.getElementById("calibrated-frame-wrap"),x=document.getElementById("biometric-oval");if(l&&e.dataUrl&&(l.src=e.dataUrl),p){let P=e.outWidth/Math.max(1,e.outHeight),d=280,w=320,M=w*P,C=w;M>d&&(M=d,C=Math.max(72,M/P)),p.style.width=`${Math.round(M)}px`,p.style.height=`${Math.round(C)}px`;let S=this.state.bgTone==="custom"?this.state.customBgColor:se[this.state.bgTone];p.style.backgroundColor=(this.state.bgRemovalEnabled||e.isPreClippedAlpha)&&this.state.bgTone!=="alpha"?S:"transparent"}let v=this.state.mode==="signature"||e.outWidth/e.outHeight>1.8;x&&(x.className=v?"w-[84%] h-[54%] border border-dashed border-sky-400 rounded-lg":"w-[62%] h-[68%] border border-dashed border-sky-400 rounded-full");let c=J(e.outWidth,"mm",this.state.dpi),g=J(e.outHeight,"mm",this.state.dpi);a("canvas-live-pill",`${e.outWidth} \xD7 ${e.outHeight} px`),a("export-exact-dims",`${e.outWidth} \xD7 ${e.outHeight} px`),a("export-physical-dims",`${c} \xD7 ${g} mm @ ${this.state.dpi} DPI (${this.state.formatExtLabel})`),a("val-live-filesize",e.hasSourceImage?`${e.sizeKb} KB`:"\u2014"),a("val-live-cap",`\u2264 ${this.state.targetCapKb} KB`),a("out-filesize-badge",e.hasSourceImage?`${e.sizeKb} KB`:"Ready");let y=Fe(this.state,e.hasSourceImage?e.sizeKb:this.state.targetCapKb*.7,t),k=document.getElementById("export-validation-badge");k&&(k.textContent=`PASS ${y.passedCount}/${y.totalCount}`,k.className=`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${y.allPassed?"bg-emerald-500/15 text-emerald-600":"bg-amber-500/15 text-amber-600"}`),a("export-btn-text",e.hasSourceImage?`Download ${e.outWidth}\xD7${e.outHeight} ${this.state.formatExtLabel} (${e.sizeKb} KB)`:`Download ${e.outWidth}\xD7${e.outHeight} ${this.state.formatExtLabel}`)}};function Ge(){if(window.__FORMPHOTO_MOUNTED__)return;window.__FORMPHOTO_MOUNTED__=!0,new be().init()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ge):Ge();
