/* =========================================================
   SAP STUDIOS: HOME (js/navigation.js)
   The approved prototype had no destinations ("#"). This file adds them without touching
   js/home.js:
     - Mouse / keyboard: the four labels are real links (only the text reacts / is clickable).
     - Touch: the first tap on a label reveals the hover state (handled by home.js); a second
       tap on the same revealed label opens the page. Tapping a quadrant still toggles the state.
   Destinations live in the HTML (href on .nav-link).
   Load this file BEFORE js/home.js.
   ========================================================= */
(function () {
  'use strict';

  var lastPointerType = 'mouse';
  var wasActive = false;

  // remember how the last interaction started (touch vs mouse/pen)
  document.addEventListener('pointerdown', function (e) { lastPointerType = e.pointerType || 'mouse'; }, true);

  Array.prototype.forEach.call(document.querySelectorAll('.nav-link'), function (link) {
    // runs before home.js's own pointerdown handler flips the .active class
    link.addEventListener('pointerdown', function () { wasActive = link.classList.contains('active'); }, true);
    link.addEventListener('click', function (e) {
      if (lastPointerType === 'touch' && !wasActive) e.preventDefault();   // first tap only reveals
    });
  });

})();
