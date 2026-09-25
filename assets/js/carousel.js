// Aqar One — unified auto carousel (.carousel > .carousel-track > .carousel-slide)
// Independent of Bootstrap's carousel plugin, which only binds to [data-bs-ride] / [data-bs-slide].
(function(){
  "use strict";
  var DELAY=3600;
  var reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function init(root){
    var track=root.querySelector(".carousel-track");
    if(!track || track.dataset.carouselInit)return;
    track.dataset.carouselInit="1";
    root.classList.add("is-auto");
    if(!track.hasAttribute("tabindex"))track.tabIndex=0;
    var prev=root.querySelector(".carousel-prev"), next=root.querySelector(".carousel-next");
    var timer=null, hovered=false, focused=false, drag=false, moved=false, startX=0, startScroll=0;
    function isRTL(){return document.documentElement.dir==="rtl"}
    function stepSize(){var s=track.querySelector(".carousel-slide");return s?s.getBoundingClientRect().width+20:track.clientWidth*.65}
    function go(dir){
      var max=Math.max(0,track.scrollWidth-track.clientWidth);
      if(!max)return;
      var amount=(isRTL()?-1:1)*dir*stepSize();
      var nextPos=track.scrollLeft+amount;
      if(!isRTL() && nextPos>=max-2 && dir>0 && track.scrollLeft>=max-2) nextPos=0;
      else if(!isRTL() && nextPos<0 && track.scrollLeft<=2) nextPos=max;
      if(isRTL() && Math.abs(nextPos)>=max-2 && dir>0 && Math.abs(track.scrollLeft)>=max-2) nextPos=0;
      else if(isRTL() && nextPos>0 && Math.abs(track.scrollLeft)<=2) nextPos=-max;
      track.scrollTo({left:nextPos,behavior:reduceMotion?"auto":"smooth"});
    }
    function stop(){clearInterval(timer);timer=null}
    function restart(){
      stop();
      if(reduceMotion||hovered||focused||drag||document.hidden)return;
      timer=setInterval(function(){if(!root.closest("[hidden]"))go(1)},DELAY);
    }
    if(prev)prev.addEventListener("click",function(){go(-1);restart()});
    if(next)next.addEventListener("click",function(){go(1);restart()});
    root.addEventListener("mouseenter",function(){hovered=true;restart()});
    root.addEventListener("mouseleave",function(){hovered=false;restart()});
    root.addEventListener("focusin",function(){focused=true;restart()});
    root.addEventListener("focusout",function(e){if(!root.contains(e.relatedTarget)){focused=false;restart()}});
    // Mouse/pen drag. Touch keeps native scrolling (pointercancel fires once the browser takes over).
    track.addEventListener("pointerdown",function(e){
      if(e.pointerType==="touch")return;
      drag=true;moved=false;startX=e.clientX;startScroll=track.scrollLeft;
      track.classList.add("is-dragging");
      if(track.setPointerCapture)track.setPointerCapture(e.pointerId);
      restart();
    });
    track.addEventListener("pointermove",function(e){if(!drag)return;var dx=e.clientX-startX;if(Math.abs(dx)>3)moved=true;track.scrollLeft=startScroll-dx});
    function endDrag(){if(!drag)return;drag=false;track.classList.remove("is-dragging");restart()}
    track.addEventListener("pointerup",endDrag);
    track.addEventListener("pointercancel",endDrag);
    track.addEventListener("click",function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
    track.addEventListener("touchstart",function(){hovered=true;restart()},{passive:true});
    track.addEventListener("touchend",function(){hovered=false;restart()},{passive:true});
    track.addEventListener("keydown",function(e){
      if(e.key==="ArrowRight"){go(isRTL()?-1:1);restart();e.preventDefault()}
      if(e.key==="ArrowLeft"){go(isRTL()?1:-1);restart();e.preventDefault()}
    });
    document.addEventListener("visibilitychange",restart);
    restart();
  }
  function all(){document.querySelectorAll(".carousel").forEach(init)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",all);else all();
  window.AqarCarousel={initAll:all};
})();
