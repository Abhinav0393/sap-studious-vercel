/* SAP Studios: Team page behaviour. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  /* The shared navigation owns the header and mobile menu. */

  /* ---- Footer year ---- */
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = year;
  });
})();
