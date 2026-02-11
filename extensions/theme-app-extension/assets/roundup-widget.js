(function() {
  var widget = document.getElementById('roundup-donation-widget');
  if (!widget) return;

  var buttons = widget.querySelectorAll('.roundup-btn');
  var thanksDiv = widget.querySelector('.roundup-thanks');
  var thanksDetail = widget.querySelector('.roundup-thanks-detail');
  var appUrl = widget.getAttribute('data-app-url') || '';
  var charityName = widget.getAttribute('data-charity-name') || 'charity';
  var shopDomain = (window.Shopify && window.Shopify.shop) ? window.Shopify.shop : '';

  function getCartTotal() {
    return fetch('/cart.js')
      .then(function(res) { return res.json(); })
      .then(function(cart) { return cart.total_price / 100; });
  }

  function setCartDonation(amount, type) {
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: {
          'roundup_donation_amount': amount.toFixed(2),
          'roundup_donation_type': type,
          'roundup_charity': charityName
        }
      })
    });
  }

  function clearCartDonation() {
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: {
          'roundup_donation_amount': '',
          'roundup_donation_type': '',
          'roundup_charity': ''
        }
      })
    });
  }

  function updateRoundUpButton() {
    var roundUpBtn = widget.querySelector('[data-action="round_up"]');
    if (!roundUpBtn) return;

    getCartTotal().then(function(total) {
      if (total <= 0) {
        roundUpBtn.style.display = 'none';
        return;
      }
      var roundUp = Math.ceil(total) - total;
      if (roundUp === 0) roundUp = 1;
      roundUpBtn.textContent = 'Round Up +$' + roundUp.toFixed(2);
      roundUpBtn.setAttribute('data-amount', roundUp.toFixed(2));
      roundUpBtn.style.display = '';
    });
  }

  updateRoundUpButton();

  buttons.forEach(function(btn) {
    btn.addEventListener('mouseenter', function() {
      if (!btn.classList.contains('roundup-selected')) {
        btn.style.background = 'var(--color-foreground, #000)';
        btn.style.color = 'var(--color-background, #fff)';
        btn.style.borderColor = 'var(--color-foreground, #000)';
      }
    });
    btn.addEventListener('mouseleave', function() {
      if (!btn.classList.contains('roundup-selected')) {
        btn.style.background = 'transparent';
        btn.style.color = 'inherit';
        btn.style.borderColor = 'var(--color-border, #e5e5e5)';
      }
    });

    btn.addEventListener('click', function() {
      var action = btn.getAttribute('data-action');
      var amount = parseFloat(btn.getAttribute('data-amount') || '0');
      var wasSelected = btn.classList.contains('roundup-selected');

      buttons.forEach(function(b) {
        b.classList.remove('roundup-selected');
        b.style.background = 'transparent';
        b.style.color = 'inherit';
        b.style.borderColor = 'var(--color-border, #e5e5e5)';
      });

      if (wasSelected) {
        thanksDiv.style.display = 'none';
        clearCartDonation();
        return;
      }

      btn.classList.add('roundup-selected');
      btn.style.background = 'var(--color-foreground, #000)';
      btn.style.color = 'var(--color-background, #fff)';
      btn.style.borderColor = 'var(--color-foreground, #000)';

      setCartDonation(amount, action).then(function() {
        thanksDetail.textContent = 'You added $' + amount.toFixed(2) + ' for ' + charityName;
        thanksDiv.style.display = 'block';
      });

      if (appUrl && shopDomain) {
        getCartTotal().then(function(total) {
          fetch(appUrl + '/api/ext/storefront-donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amount.toFixed(2),
              originalTotal: total.toFixed(2),
              roundedTotal: (total + amount).toFixed(2),
              donationType: action,
              channel: 'checkout',
              shopDomain: shopDomain
            })
          }).catch(function(err) {
            console.warn('RoundUp: Could not record donation', err);
          });
        });
      }
    });
  });
})();
