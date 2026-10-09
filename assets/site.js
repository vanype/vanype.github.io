/* Effects adapted from React Bits (reactbits.dev), (c) 2026 David Haz, MIT + Commons Clause. See assets/site.css header. */
(function(){
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Hide empty "Роль/Результат" rows (placeholders awaiting data) */
document.querySelectorAll('dl.facts').forEach(function(dl){
  var dds = dl.querySelectorAll('dd'), filled = 0;
  dds.forEach(function(dd){
    if (!dd.textContent.trim()) { dd.classList.add('empty'); var dt = dd.previousElementSibling; if (dt) dt.classList.add('empty'); }
    else filled++;
  });
  if (!filled) dl.classList.add('all-empty');
});

/* BlurText: split headline into words */
var h = document.querySelector('.blur-text .gradient-text');
if (h && !reduce) {
  var words = h.textContent.split(' ');
  h.parentNode.setAttribute('aria-label', h.textContent);
  var g = h.parentNode; g.innerHTML = '';
  words.forEach(function(w, i){
    var s = document.createElement('span');
    s.className = 'w blur-w gradient-text'; s.setAttribute('aria-hidden','true');
    s.style.setProperty('--d', (0.12 + i*0.18) + 's'); s.textContent = w;
    g.appendChild(s);
  });
}

/* Scroll reveals (AnimatedContent-style) */
var items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduce) {
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
  items.forEach(function(el){ io.observe(el); });
} else items.forEach(function(el){ el.classList.add('in'); });

/* SpotlightCard: inject layers, track pointer */
document.querySelectorAll('.spotlight').forEach(function(c){
  ['sl','bd','ed'].forEach(function(k){ var s=document.createElement('span'); s.className=k; s.setAttribute('aria-hidden','true'); k==='sl'?c.prepend(s):c.appendChild(s); });
  c.addEventListener('pointermove', function(e){
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});

/* CountUp: animate numbers in [data-count] */
var nums = document.querySelectorAll('[data-count]');
if (nums.length && 'IntersectionObserver' in window && !reduce) {
  var cio = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var el = e.target, to = +el.getAttribute('data-count'), t0 = null, dur = 1400;
      (function step(t){ if (t0===null) t0 = t; var k = Math.min(1,(t-t0)/dur); el.textContent = Math.round(to*(1-Math.pow(1-k,3))); if (k<1) requestAnimationFrame(step); })(performance.now());
    });
  }, {threshold:0.4});
  nums.forEach(function(n){ n.textContent = '0'; cio.observe(n); });
}

/* Sticky nav state + active section */
var nav = document.getElementById('nav'), links = Array.prototype.filter.call(nav.querySelectorAll('a'), function(a){ return (a.getAttribute('href')||'').charAt(0)==='#'; });
var secs = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
function onScroll(){
  nav.classList.toggle('scrolled', scrollY > 20);
  var y = scrollY + innerHeight*0.35, idx = 0;
  secs.forEach(function(s,i){ if (s && s.offsetParent!==null && s.getBoundingClientRect().top + scrollY <= y) idx = i; });
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) idx = secs.length - 1;
  links.forEach(function(a,i){ a.classList.toggle('active', i===idx && !!secs[i] && secs[i].offsetParent!==null); });
}
addEventListener('scroll', onScroll, {passive:true}); onScroll();

/* Aurora background (WebGL2 port of React Bits <Aurora/>) */
var host = document.getElementById('aurora');
var canvas = document.createElement('canvas');
var gl = canvas.getContext('webgl2', {alpha:true, premultipliedAlpha:true, antialias:false});
if (!gl) { host.style.background = 'radial-gradient(ellipse at 30% 0%,rgba(124,92,255,.35),transparent 60%),radial-gradient(ellipse at 80% 10%,rgba(62,230,196,.22),transparent 55%)'; return; }
host.appendChild(canvas);
var VERT = '#version 300 es\nin vec2 position;\nvoid main(){gl_Position=vec4(position,0.0,1.0);}';
var FRAG = ['#version 300 es','precision highp float;',
'uniform float uTime;uniform float uAmplitude;uniform vec3 uColorStops[3];uniform vec2 uResolution;uniform float uBlend;out vec4 fragColor;',
'vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}',
'float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
'vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);',
'vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);',
'vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
'vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;',
'vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;',
'm*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}',
'void main(){vec2 uv=gl_FragCoord.xy/uResolution;',
'vec3 rampColor=uv.x<0.5?mix(uColorStops[0],uColorStops[1],uv.x*2.0):mix(uColorStops[1],uColorStops[2],(uv.x-0.5)*2.0);',
'float height=snoise(vec2(uv.x*2.0+uTime*0.1,uTime*0.25))*0.5*uAmplitude;height=exp(height);',
'height=(uv.y*2.0-height+0.2);float intensity=0.6*height;float midPoint=0.20;',
'float auroraAlpha=smoothstep(midPoint-uBlend*0.5,midPoint+uBlend*0.5,intensity);',
'vec3 auroraColor=intensity*rampColor;fragColor=vec4(auroraColor*auroraAlpha,auroraAlpha);}'].join('\n');
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.warn(gl.getShaderInfoLog(o));return o;}
var prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER,VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
var loc = gl.getAttribLocation(prog,'position'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
var U = function(n){return gl.getUniformLocation(prog,n);};
var uT=U('uTime'), uR=U('uResolution');
gl.uniform1f(U('uAmplitude'), 1.0); gl.uniform1f(U('uBlend'), 0.55);
function hex(c){return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255];}
var stops = (host.getAttribute('data-colors') || '#5227ff,#3ee6c4,#7c5cff').split(',');
gl.uniform3fv(U('uColorStops'), new Float32Array([].concat(hex(stops[0]), hex(stops[1]), hex(stops[2]))));
gl.clearColor(0,0,0,0); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
function resize(){
  var dpr = Math.min(window.devicePixelRatio||1, 1.5) * 0.6; /* render at reduced res: soft gradient, cheap */
  canvas.width = Math.max(1, host.clientWidth*dpr|0); canvas.height = Math.max(1, host.clientHeight*dpr|0);
  gl.viewport(0,0,canvas.width,canvas.height); gl.uniform2f(uR, canvas.width, canvas.height);
}
addEventListener('resize', resize); resize();
function draw(t){ gl.uniform1f(uT, t*0.01*0.1*0.6); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES,0,3); }
if (reduce) { draw(1200); return; }
var visible = true, raf = 0;
new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(host);
function loop(t){ raf = 0; if (!visible || document.hidden) return; draw(t); raf = requestAnimationFrame(loop); }
document.addEventListener('visibilitychange', function(){ if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });
raf = requestAnimationFrame(loop);
})();
