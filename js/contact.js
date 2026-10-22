/* js/contact.js — SAP Studios Contact Form Logic
   Enhanced with async fetch to api/contact.php, spam defenses,
   accessible ARIA announcements, and graceful mailto/no-JS fallback.
*/

(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  var submitBtn = document.getElementById('contact-submit');
  var timeInput = document.getElementById('contact-time');

  if (!form) return;

  // Initialize timestamp on page load (in seconds)
  if (timeInput) {
    timeInput.value = Math.floor(Date.now() / 1000);
  }

  // Handle URL query parameter ?sent=1 from non-JS fallback submission
  if (window.location.search.indexOf('sent=1') !== -1 && feedback) {
    feedback.textContent = 'Thank you. Your enquiry has been received. Our team will review your project and get in touch.';
    feedback.style.color = '#111';
    feedback.style.fontWeight = '500';
    feedback.setAttribute('tabindex', '-1');
    feedback.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var descInput = document.getElementById('contact-desc');
    var aspInput = document.getElementById('contact-aspirations');

    var name = (nameInput ? nameInput.value : '').trim();
    var email = (emailInput ? emailInput.value : '').trim();
    var description = (descInput ? descInput.value : '').trim();
    var aspirations = (aspInput ? aspInput.value : '').trim();

    // Client-side validation
    if (!name) {
      showFeedback('Please provide your name.', '#c00');
      if (nameInput) nameInput.focus();
      return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      showFeedback('Please provide a valid email address.', '#c00');
      if (emailInput) emailInput.focus();
      return;
    }

    if (!description && !aspirations) {
      showFeedback('Please describe your project or your aspirations for the space.', '#c00');
      if (descInput) descInput.focus();
      return;
    }

    // Set UI loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'SENDING...';
    }
    showFeedback('Sending your enquiry to SAP Studios...', '#111');

    var formData = new FormData(form);

    fetch('api/contact.php', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function (res) {
      return res.json().catch(function () {
        return { ok: res.ok, message: res.ok ? 'Enquiry submitted successfully.' : 'Server error occurred (' + res.status + ').' };
      });
    })
    .then(function (data) {
      if (data && data.ok) {
        showFeedback(data.message || 'Thank you. Your enquiry has been received. Our team will review your project and get in touch.', '#111');
        form.reset();
        if (timeInput) {
          timeInput.value = Math.floor(Date.now() / 1000);
        }
      } else {
        var errDetail = data && data.message ? data.message : 'Unable to submit your enquiry at this time.';
        showFeedback(errDetail, '#c00');
      }
    })
    .catch(function (err) {
      // Network or environment failure fallback
      console.warn('Direct fetch failed, presenting mailto fallback:', err);
      showFeedback('Unable to reach server directly. Please email us at design@sapstudios.in or message us on WhatsApp +91 83283 86698.', '#c00');
    })
    .finally(function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'SUBMIT →';
      }
    });
  });

  function showFeedback(msg, color) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.style.color = color;
    feedback.setAttribute('tabindex', '-1');
    feedback.focus({ preventScroll: true });
  }
})();
